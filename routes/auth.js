const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login Compatibility Redirect
router.get('/admin', (req, res) => res.redirect('/admin/dashboard'));

// Login Page
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', {
        error: null,
        returnTo: req.query.returnTo || ''
    });
});

// Login Action
router.post('/login', async (req, res) => {
    const { email, password, returnTo } = req.body;
    try {
        const user = await User.findOne({ where: { email, isActive: true } });
        if (user && await user.validPassword(password)) {
            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.userName = user.name;
            req.session.userEmail = user.email;
            return res.redirect(returnTo || '/admin/dashboard');
        }
        res.render('admin/login', {
            error: 'Invalid email or password',
            returnTo: returnTo || ''
        });
    } catch (error) {
        console.error(error);
        res.render('admin/login', {
            error: 'An error occurred',
            returnTo: returnTo || ''
        });
    }
});
// Register Page
router.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/register', { error: null });
});

// Register Action
router.post('/register', async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('admin/register', { error: 'Passwords do not match' });
    }

    try {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.render('admin/register', { error: 'Email already registered' });
        }

        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: 'member' // Default role
        });

        // Auto login after register
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.userName = user.name;
        req.session.userEmail = user.email;

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.render('admin/register', { error: 'An error occurred during registration' });
    }
});

// Logout Action
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
