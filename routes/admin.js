import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import { isAdmin } from '../lib/authMiddleware.js';

router.use(isAdmin);

// Base Admin Redirect
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Dashboard
router.get('/dashboard', async (req, res) => {
    const userCount = await User.count();
    const bankCount = await BankAccount.count();
    res.render('admin/dashboard', {
        counts: { users: userCount, banks: bankCount }
    });
});

// === User Management ===
router.get('/users', async (req, res) => {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/users/index', { users });
});

router.post('/users', async (req, res) => {
    try {
        const { email, password, isActive } = req.body;
        await User.create({
            email,
            password,
            isActive: isActive === 'true'
        });
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating user');
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { email, password, isActive } = req.body;
        const user = await User.findByPk(req.params.id);
        if (user) {
            user.email = email;
            if (password) user.password = password; // Hook handles hash
            user.isActive = isActive === 'true';
            await user.save();
        }
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user');
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        res.redirect('/admin/users');
    } catch (error) {
        res.status(500).send('Error deleting user');
    }
});

// === Bank Management ===
router.get('/banks', async (req, res) => {
    const banks = await BankAccount.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/banks/index', { banks });
});

router.post('/banks', async (req, res) => {
    try {
        const { name, bank, accountNumber, isActive } = req.body;
        await BankAccount.create({
            name,
            bank,
            accountNumber,
            isActive: isActive === 'true'
        });
        res.redirect('/admin/banks');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating bank account');
    }
});

router.put('/banks/:id', async (req, res) => {
    try {
        const { name, bank, accountNumber, isActive } = req.body;
        const bankAccount = await BankAccount.findByPk(req.params.id);
        if (bankAccount) {
            bankAccount.name = name;
            bankAccount.bank = bank;
            bankAccount.accountNumber = accountNumber;
            bankAccount.isActive = isActive === 'true';
            await bankAccount.save();
        }
        res.redirect('/admin/banks');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating bank account');
    }
});

router.delete('/banks/:id', async (req, res) => {
    try {
        await BankAccount.destroy({ where: { id: req.params.id } });
        res.redirect('/admin/banks');
    } catch (error) {
        res.status(500).send('Error deleting bank');
    }
});

export default router;
