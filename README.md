# AmalanBaik.id - Platform Crowdfunding

Platform crowdfunding berbasis web untuk mengelola kampanye donasi, zakat, infak, dan wakaf. Dibangun dengan Node.js, Express, MySQL, dan Tailwind CSS.

## 📋 Fitur Utama

- **Manajemen Kampanye**: CRUD kampanye dengan target donasi dan tracking progress
- **Sistem Donasi**: Proses donasi dengan konfirmasi pembayaran manual
- **Media Management**: Upload dan kelola gambar untuk kampanye dan slider
- **Dynamic Slider**: Banner carousel di halaman utama yang dapat dikelola admin
- **WhatsApp Integration**: Notifikasi otomatis via WhatsApp
- **Admin Dashboard**: Panel admin lengkap untuk mengelola semua aspek platform
- **User Authentication**: Login/Register dengan session management
- **Responsive Design**: Tampilan mobile-first dengan Tailwind CSS

## 🚀 Instalasi

### Prasyarat

Pastikan sudah terinstal:
- **Node.js** v16 atau lebih tinggi
- **MySQL** v5.7 atau lebih tinggi
- **npm** atau **yarn**

### Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd AmalanBaikAja
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Database**
   
   Buat database MySQL baru:
   ```sql
   CREATE DATABASE amalan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Konfigurasi Environment**
   
   Buat file `.env` di root project:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=amalan_db
   DB_PORT=3306

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Session Secret (ganti dengan string random yang aman)
   SESSION_SECRET=your-super-secret-key-change-this-in-production

   # WhatsApp Configuration (opsional)
   WA_SESSION_PATH=./wa-session
   ```

5. **Build CSS**
   ```bash
   npm run build:css
   ```

6. **Jalankan Server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

7. **Akses Aplikasi**
   
   Buka browser dan akses:
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/login`
   
   **Default Admin Credentials:**
   - Email: `admin@amalan.com`
   - Password: `admin`
   
   ⚠️ **PENTING**: Segera ubah password default setelah login pertama kali!

## 📁 Struktur Project

```
AmalanBaikAja/
├── config/
│   └── database.js          # Konfigurasi database
├── lib/
│   ├── authMiddleware.js    # Middleware autentikasi
│   └── whatsapp.js          # WhatsApp integration
├── models/                  # Sequelize models
│   ├── User.js
│   ├── Campaign.js
│   ├── Donation.js
│   ├── Slider.js
│   └── ...
├── routes/                  # Express routes
│   ├── index.js             # Frontend routes
│   ├── admin_*.js           # Admin routes
│   └── ...
├── views/                   # EJS templates
│   ├── front/               # Frontend views
│   ├── admin/               # Admin views
│   ├── partials/            # Reusable components
│   └── errors/              # Error pages
├── public/                  # Static files
│   ├── css/
│   ├── images/
│   └── uploads/             # User uploaded files
├── worker.js                # Background worker
├── index.js                 # Main application file
└── package.json
```

## 🔧 Konfigurasi Production

### 1. Environment Variables

Untuk production, update `.env`:
```env
NODE_ENV=production
SESSION_SECRET=<generate-strong-random-string>
DB_HOST=<your-production-db-host>
DB_USER=<your-production-db-user>
DB_PASSWORD=<strong-password>
```

### 2. Process Manager (PM2)

Install PM2 globally:
```bash
npm install -g pm2
```

Jalankan aplikasi dengan PM2:
```bash
pm2 start index.js --name "amalan-baik"
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy

Contoh konfigurasi Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files
    location /uploads {
        alias /path/to/AmalanBaikAja/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com
```

## 📝 Scripts NPM

- `npm start` - Jalankan server production
- `npm run dev` - Jalankan development server dengan auto-reload
- `npm run build:css` - Build Tailwind CSS

## 🗄️ Database Migration

Database akan otomatis di-sync saat pertama kali aplikasi dijalankan menggunakan Sequelize `sync({ alter: true })`.

Untuk production, disarankan menggunakan migration manual:
1. Backup database sebelum update
2. Review perubahan schema
3. Jalankan migration secara bertahap

## 🔐 Keamanan

### Best Practices:

1. **Ganti Credentials Default**
   - Ubah password admin default
   - Generate SESSION_SECRET yang kuat

2. **Database**
   - Gunakan user database dengan privilege terbatas
   - Aktifkan SSL untuk koneksi database

3. **File Upload**
   - Validasi tipe file yang diupload
   - Batasi ukuran file maksimal (default: 5MB)

4. **HTTPS**
   - Selalu gunakan HTTPS di production
   - Redirect HTTP ke HTTPS

5. **Environment Variables**
   - Jangan commit file `.env` ke repository
   - Gunakan environment variables untuk semua konfigurasi sensitif

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Unable to connect to the database
```
**Solusi**: Periksa konfigurasi database di `.env` dan pastikan MySQL service berjalan.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solusi**: Ganti PORT di `.env` atau hentikan aplikasi yang menggunakan port tersebut.

### CSS Not Loading
**Solusi**: Jalankan `npm run build:css` untuk generate CSS dari Tailwind.

### Upload Directory Permission
**Solusi**: 
```bash
chmod 755 public/uploads
```

## 📞 Support

Untuk bantuan atau pertanyaan:
- Email: yasir.maulana@gmail.com
- Website: https://amalanbaik.id

## 📄 License

Copyright © 2026 AmalanBaik.id

---

**Dibuat dengan ❤️ untuk memudahkan amal jariyah**
# baznas-yia
