const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');


router.get('/estadisticas/resumen', verificarToken, productoController.obtenerEstadisticas);

router.get('/catalogos/categorias', verificarToken, productoController.obtenerCategorias);
router.get('/catalogos/impuestos', verificarToken, productoController.obtenerImpuestosDisponibles);
router.get('/catalogos/listas-precios',verificarToken, productoController.obtenerListasPrecios);

router.post('/stock/consultar-multiple', verificarToken, productoController.consultarStockMultiple);

router.get('/categorias/buscar',   verificarToken, productoController.buscarCategorias);
router.get('/categorias/:id',      verificarToken, productoController.obtenerCategoriaPorId);
router.post('/categorias',         verificarToken, verificarAdmin, productoController.crearCategoria);
router.put('/categorias/:id',      verificarToken, verificarAdmin, productoController.actualizarCategoria);
router.delete('/categorias/:id',   verificarToken, verificarAdmin, productoController.eliminarCategoria);

router.post('/',  verificarToken, verificarAdmin, productoController.registrar);
router.get('/',   verificarToken, productoController.listar);
router.get('/:id', verificarToken, productoController.obtenerPorId);
router.put('/:id', verificarToken, verificarAdmin, productoController.actualizar);
router.patch('/:id/estado', verificarToken, verificarAdmin, productoController.cambiarEstado);

router.get('/:id/stock',          verificarToken, productoController.consultarStock);
router.patch('/:id/peso',         verificarToken, verificarAdmin, productoController.actualizarPeso);
router.patch('/:id/peso-stock',   verificarToken, verificarAdmin, productoController.actualizarPesoYStock);
router.get('/:id/impuestos',      verificarToken, productoController.obtenerImpuestos);
router.post('/:id/impuestos',     verificarToken, verificarAdmin, productoController.asignarImpuesto);
router.get('/:id/precios',        verificarToken, productoController.obtenerPreciosPorCliente);
router.post('/:id/precios-especiales', verificarToken, verificarAdmin, productoController.configurarPrecioEspecial);

module.exports = router;