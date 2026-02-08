import { v2 as cloudinaryV2 } from 'cloudinary';
const cloudinary = cloudinaryV2;
export { cloudinary };
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDirname } from './esm_utils.js';

const __dirname = getDirname(import.meta.url);

// Configuration
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        secure: true
    });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dokznxsab',
        api_key: process.env.CLOUDINARY_API_KEY || '667666379514598',
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

// Validation
if (process.env.NODE_ENV === 'production' || process.env.CLOUDINARY_API_SECRET) {
    if (!cloudinary.config().api_secret || cloudinary.config().api_secret === '<your_api_secret>') {
        console.warn('WARNING: Cloudinary API Secret is missing or using placeholder! Uploads will fail in production.');
    }
}

import sharp from 'sharp';

/**
 * Creates a multer instance for single/multiple file uploads with automatic WebP conversion.
 * @param {string} folderName - The folder name (e.g., 'campaigns', 'posts', 'media')
 */
export const createUpload = (folderName) => {
    let storage;

    if (process.env.NODE_ENV === 'production') {
        storage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: `baznas-yia/${folderName}`,
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
                format: 'webp', // Force webp conversion in Cloudinary
                public_id: (req, file) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    return file.fieldname + '-' + uniqueSuffix;
                }
            },
        });
    } else {
        // Custom storage engine for local WebP conversion
        storage = {
            _handleFile: function (req, file, cb) {
                const subFolder = folderName === 'media' ? '' : folderName;
                const uploadDir = path.join(__dirname, '../public/uploads', subFolder);

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = file.fieldname + '-' + uniqueSuffix + '.webp';
                const fullPath = path.join(uploadDir, filename);

                const outStream = fs.createWriteStream(fullPath);
                const transform = sharp().webp({ quality: 80 });

                file.stream.pipe(transform).pipe(outStream);

                outStream.on('error', cb);
                outStream.on('finish', function () {
                    cb(null, {
                        destination: uploadDir,
                        filename: filename,
                        path: fullPath,
                        size: outStream.bytesWritten
                    });
                });
            },
            _removeFile: function (req, file, cb) {
                fs.unlink(file.path, cb);
            }
        };
    }

    return multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: function (req, file, cb) {
            const filetypes = /jpeg|jpg|png|gif|webp/;
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype || extname) {
                return cb(null, true);
            }
            cb(new Error("Error: File upload only supports images"));
        }
    });
};

/**
 * Deletes a file from either local storage or Cloudinary.
 * @param {string} filePath - The path or URL of the file to delete.
 */
export const deleteFile = async (filePath) => {
    if (!filePath) return;

    if (process.env.NODE_ENV === 'production') {
        try {
            // Extract public_id from Cloudinary URL
            // Example: https://res.cloudinary.com/cloud_name/image/upload/v12345/baznas-yia/campaigns/image-123.jpg
            const parts = filePath.split('/');
            const fileNameWithExt = parts.pop();
            const fileName = fileNameWithExt.split('.')[0];
            const subFolder = parts.pop();
            const rootFolder = parts.pop();

            if (rootFolder === 'baznas-yia') {
                const publicId = `${rootFolder}/${subFolder}/${fileName}`;
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (error) {
            console.error('Error deleting file from Cloudinary:', error);
        }
    } else {
        const localPath = path.join(__dirname, '../public', filePath);
        if (fs.existsSync(localPath)) {
            try {
                fs.unlinkSync(localPath);
            } catch (error) {
                console.error('Error deleting local file:', error);
            }
        }
    }
};

/**
 * Formats the file path for database storage based on the environment.
 * @param {object} file - The req.file object.
 * @param {string} folderName - The folder name.
 */
export const getFilePath = (file, folderName) => {
    if (!file) return null;
    if (process.env.NODE_ENV === 'production') {
        return file.path; // Cloudinary URL
    }
    const subFolder = folderName === 'media' ? '' : folderName;
    return path.join('/uploads', subFolder, file.filename).replace(/\\/g, '/');
};

export default { createUpload, deleteFile, getFilePath, cloudinary };
