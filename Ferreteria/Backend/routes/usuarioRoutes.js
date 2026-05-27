const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioControlles');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');


// Catálogos
router.get('/catalogos/roles', verificarToken, usuarioController.obtenerRoles);

// Empleados sin usuario asignado (para el formulario de crear usuario)
router.get('/sin-usuario', verificarToken, verificarAdmin, usuarioController.obtenerEmpleadosSinUsuario);

router.post('/', verificarToken, verificarAdmin, usuarioController.crear);
router.get('/', verificarToken, verificarAdmin, usuarioController.listar);
router.get('/:id', verificarToken, usuarioController.obtenerPorId);
router.put('/:id', verificarToken, verificarAdmin, usuarioController.actualizar);

router.patch('/:id/estado', verificarToken, verificarAdmin, usuarioController.cambiarEstado);
router.patch('/:id/password', verificarToken, usuarioController.cambiarPassword);

module.exports = router;