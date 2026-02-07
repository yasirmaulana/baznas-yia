import express from 'express';
const router = express.Router();
import BankMutation from '../models/BankMutation.js';
import BankAccount from '../models/BankAccount.js';
import { Op } from 'sequelize';
import { isAdmin } from '../lib/authMiddleware.js';

router.use(isAdmin);

router.get('/', async (req, res) => {
    const { date, bankId } = req.query;
    let where = {};

    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.date = { [Op.between]: [start, end] };
    }

    if (bankId) {
        where.bankAccountId = bankId;
    }

    const mutations = await BankMutation.findAll({
        where,
        include: [{ model: BankAccount, as: 'bankAccount' }],
        order: [['date', 'DESC']],
        limit: 100 // Cap results
    });

    const banks = await BankAccount.findAll();

    res.render('admin/mutations/index', { mutations, banks, query: req.query });
});

export default router;
