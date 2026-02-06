const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const WhatsappSession = require('../models/WhatsappSession');
const EventEmitter = require('events');

class WhatsappManager extends EventEmitter {
    constructor() {
        super();
        this.sessions = new Map(); // Store active socket connections
        this.qrCodes = new Map();  // Store current QR codes
    }

    async init() {
        console.log('Initializing WhatsApp Manager...');
        const sessions = await WhatsappSession.findAll();
        for (const session of sessions) {
            this.startSession(session.sessionName);
        }
    }

    async startSession(sessionName) {
        if (this.sessions.has(sessionName)) return;

        console.log(`Starting session: ${sessionName}`);

        // Ensure auth directory exists
        const authPath = path.join(__dirname, '../whatsapp_sessions', sessionName);
        if (!fs.existsSync(authPath)) {
            fs.mkdirSync(authPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        const sock = makeWASocket({
            printQRInTerminal: false,
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ["Amalan App", "Chrome", "1.0.0"]
        });

        // Handle Events
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(`QR Generated for ${sessionName}`);
                this.qrCodes.set(sessionName, qr);
                this.emit('qr', { sessionName, qr });

                // Update DB status
                await WhatsappSession.update({ status: 'scanning' }, { where: { sessionName } });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`Connection closed for ${sessionName}, reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    this.sessions.delete(sessionName);
                    this.startSession(sessionName);
                } else {
                    console.log(`${sessionName} logged out.`);
                    this.sessions.delete(sessionName);
                    await WhatsappSession.update({ status: 'disconnected' }, { where: { sessionName } });
                    // Optional: Clean up auth file
                }
            } else if (connection === 'open') {
                console.log(`${sessionName} connected successfully.`);
                this.qrCodes.delete(sessionName);
                const user = sock.user;

                await WhatsappSession.update({
                    status: 'connected',
                    phoneNumber: user.id ? user.id.split(':')[0] : null
                }, { where: { sessionName } });
            }
        });

        sock.ev.on('creds.update', saveCreds);

        this.sessions.set(sessionName, sock);
    }

    async getSession(sessionName) {
        if (!this.sessions.has(sessionName)) {
            await this.startSession(sessionName);
        }
        return this.sessions.get(sessionName);
    }

    getQR(sessionName) {
        return this.qrCodes.get(sessionName);
    }

    async sendMessage(sessionName, number, text) {
        const sock = this.sessions.get(sessionName);
        if (!sock) throw new Error('Session not active');

        const id = number + '@s.whatsapp.net';
        await sock.sendMessage(id, { text });
        return true;
    }

    async deleteSession(sessionName) {
        try {
            if (this.sessions.has(sessionName)) {
                const sock = this.sessions.get(sessionName);
                sock.end(undefined);
                this.sessions.delete(sessionName);
            }

            // Remove directory
            const authPath = path.join(__dirname, '../whatsapp_sessions', sessionName);
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}

// Singleton
const whatsappManager = new WhatsappManager();
module.exports = whatsappManager;
