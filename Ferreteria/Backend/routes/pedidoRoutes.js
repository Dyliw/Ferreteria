const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.post('/', 
    verificarToken, 
    pedidoController.crearPedido
);
router.get('/', 
    verificarToken, 
    pedidoController.listarPedidos
);
router.get('/:id', 
    verificarToken, 
    pedidoController.obtenerPedido
);
router.put('/:id/estado', 
    verificarToken, 
    verificarRol([1, 2]), // Admin o Ventas
    pedidoController.actualizarEstado
);
router.get('/:id/historial', 
    verificarToken, 
    pedidoController.obtenerHistorial
);
router.get('/catalogos/estados', 
    verificarToken, 
    pedidoController.obtenerEstados
);

router.get('/estadisticas/resumen', 
    verificarToken, 
    verificarRol([1]), // Solo admin
    pedidoController.obtenerEstadisticas
);

module.exports = router;