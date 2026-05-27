const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');


router.get('/catalogos/puestos', verificarToken, empleadoController.obtenerPuestos);

router.get('/disponibles/lista', verificarToken, empleadoController.obtenerDisponibles);

router.get('/estadisticas/resumen', verificarToken, verificarAdmin, empleadoController.obtenerEstadisticas);

router.post('/', verificarToken, verificarAdmin, empleadoController.registrar);
router.get('/', verificarToken, empleadoController.listar);
router.get('/:id', verificarToken, empleadoController.obtenerPorId);
router.put('/:id', verificarToken, verificarAdmin, empleadoController.actualizar);

router.get('/puesto/:id_puesto', verificarToken, empleadoController.obtenerPorPuesto);

module.exports = router;
