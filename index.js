require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const methodOverride = require('method-override');
const path = require('path');
const sequelize = require('./config/database');
const { runSeeders } = require('./scripts/seeders');
const { loadRoutes } = require('./routes/loader');
const whatsappManager = require('./lib/whatsapp');
const startWorker = require('./worker');

const app = express();

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
// Session Store Configuration
const sessionStore = new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 24 * 60 * 60 * 1000 // Session expires after 24 hours
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Global Locals Middleware
app.use((req, res, next) => {
    res.locals.isLoggedIn = !!req.session.userId;
    res.locals.userId = req.session.userId;
    res.locals.session = req.session;
    res.locals.path = req.path;
    next();
});

// Load Routes
loadRoutes(app);

// 404 Handler
app.use((req, res) => {
    res.status(404).render('errors/404', {
        pageTitle: '404 - Halaman Tidak Ditemukan',
        path: req.path
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    const status = err.status || 500;
    res.status(status);

    if (req.accepts('html')) {
        res.render('errors/500', {
            pageTitle: 'Error',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    } else {
        res.json({
            error: {
                message: err.message || 'Internal Server Error',
                status
            }
        });
    }
});

// Database Sync & Server Start
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Test connection and sync models
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        await sequelize.sync({ alter: false });
        console.log('Database synchronized.');

        // Sync session store (creates Sessions table)
        await sessionStore.sync();
        console.log('Session store synchronized.');

        // Run initial seeders
        await runSeeders();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            // Initialize services
            whatsappManager.init();
            startWorker();
        });
    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1);
    }
}

startServer();

