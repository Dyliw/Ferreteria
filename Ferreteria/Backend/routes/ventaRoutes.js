const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.get('/catalogos/metodos-pago', 
    verificarToken, 
    ventaController.obtenerMetodosPago
);

router.get('/estadisticas/resumen', 
    verificarToken, 
    ventaController.obtenerEstadisticas
);

router.get('/', 
    verificarToken, 
    ventaController.listarVentas
);

router.post('/', 
    verificarToken, 
    ventaController.registrarVenta
);

router.get('/:id', 
    verificarToken, 
    ventaController.obtenerPorId
);

router.get('/:id/ticket/html', 
    verificarToken, 
    ventaController.generarTicketHTML
);

router.get('/:id/ticket/pdf', 
    verificarToken, 
    ventaController.generarTicketPDF
);

router.get('/:id/ticket/download', 
    verificarToken, 
    ventaController.descargarTicketPDF
);
router.put('/:id/cancelar', 
    verificarToken, 
    verificarRol([1, 2]), 
    ventaController.cancelarVenta
);
router.post('/:id/pagos', 
    verificarToken, 
    ventaController.registrarPago
);

module.exports = router;