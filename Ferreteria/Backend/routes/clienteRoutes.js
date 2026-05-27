const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/catalogos/tipos', clienteController.obtenerTiposCliente);


router.get('/estadisticas/resumen', clienteController.obtenerEstadisticas);

router.get('/codigo-postal/:cp', clienteController.buscarPorCP);

router.post('/', clienteController.registrar);          
router.get('/', clienteController.buscar);   
router.get('/:id', clienteController.obtenerPorId);  
router.put('/:id', clienteController.actualizar);    

router.patch('/:id/tipo', clienteController.cambiarTipoCliente);
router.patch('/:id/estado', clienteController.cambiarEstado); 

module.exports = router;