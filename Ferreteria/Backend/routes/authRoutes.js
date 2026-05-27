const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

// Login público
router.post('/login', authController.login);

// Verificar token (para mantener sesión)
router.get('/verificar', verificarToken, authController.verificarToken);

// Logout (opcional)
router.post('/logout', verificarToken, authController.logout);

// Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, authController.obtenerPerfil);

module.exports = router;