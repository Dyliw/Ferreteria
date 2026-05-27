const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verificarToken, verificarAdmin, verificarRol } = require('../middleware/authMiddleware');

router.post('/entrada', 
    verificarToken, 
    verificarRol([1, 3]), 
    inventarioController.registrarEntrada
);

router.post('/ajuste', 
    verificarToken, 
    verificarRol([1, 3]), // Admin o Almacén
    inventarioController.registrarAjuste
);

router.get('/movimientos', 
    verificarToken, 
    inventarioController.listarMovimientos
);

router.get('/movimientos/producto/:id', 
    verificarToken, 
    inventarioController.obtenerMovimientosPorProducto
);

router.get('/movimientos/:id', 
    verificarToken, 
    inventarioController.obtenerMovimientoPorId
);

router.get('/tipos-movimiento', 
    verificarToken, 
    inventarioController.obtenerTiposMovimiento
);

router.get('/reportes/rotacion', 
    verificarToken, 
    inventarioController.reporteRotacion
);

router.get('/reportes/valor', 
    verificarToken, 
    inventarioController.reporteValorInventario
);

router.get('/reportes/stock-bajo', 
    verificarToken, 
    inventarioController.reporteStockBajo
);
router.get('/dashboard', 
    verificarToken, 
    inventarioController.dashboard
);

module.exports = router;