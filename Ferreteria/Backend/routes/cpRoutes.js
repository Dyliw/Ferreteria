const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Buscar código postal
router.get('/buscar/:cp', async (req, res) => {
    try {
        const { cp } = req.params;
        const result = await query(`
            SELECT * FROM buscar_cp(@cp)
        `, { cp });
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;