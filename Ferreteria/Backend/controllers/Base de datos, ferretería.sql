CREATE DATABASE cp;
use cp;
SELECT SUSER_NAME();
----------------Codigos postales-----------------------------
Create table elementos(
)
create table cps(
 idcp int not null identity,
 cp nvarchar(5),
 asentamiento nvarchar(100),
 idtipo_asentamiento int,
 tipo_asentamiento varchar(50),
 idmunicipio int,
 municipio varchar(100),
 idciudad varchar(5),
 ciudad varchar(100),
 idestado int,
 zona VARCHAR(50),
 estado varchar(100));

--Insertar y limpiar dato
INSERT INTO cps(
    cp,asentamiento,idtipo_asentamiento,tipo_asentamiento,
    idmunicipio,municipio,idciudad,ciudad,idestado,zona,estado
)
SELECT 
    d_codigo,
    d_asenta,
    c_tipo_asenta,
    d_tipo_asenta,
    c_mnpio,
    D_mnpio,
    c_cve_ciudad,
    d_ciudad,
    c_estado,
    d_zona,
    d_estado
FROM Zacatecas
WHERE d_codigo IS NOT NULL;

--limpieza
DELETE FROM cps
WHERE cp IS NULL OR cp = '';

select  * from cps;
--Estados

CREATE TABLE Estados(
    idestado SMALLINT not null,
    estado varchar(150) not null,
    CONSTRAINT PK_idestado PRIMARY KEY(idestado)
)
insert into Estados(idestado,estado)
select DISTINCT idestado, estado from cps;

select * from Estados

--Tipo Ansentamiento
create table TipoAnsentamiento(
    idtipo_asentamiento smallint not null,
    tipo_asentamiento VARCHAR(50)
    CONSTRAINT PK_idTipoAsentamiento_Asentamientos PRIMARY KEY(idtipo_asentamiento)
)

insert into TipoAnsentamiento(idtipo_asentamiento,tipo_asentamiento)
select  DISTINCT idtipo_asentamiento,tipo_asentamiento from cps order by idtipo_asentamiento

SELECT * from TipoAnsentamiento

--Asentamientos
create table Asentamientos(
    idasentamiento int not null identity,
    asentamiento varchar(100) not null,
    idtipo_asentamiento smallint not null,
    CONSTRAINT PK_idasentamiento PRIMARY KEY(idasentamiento),
    CONSTRAINT FK_idtipo_asentamiento FOREIGN KEY(idtipo_asentamiento) REFERENCES TipoAnsentamiento(idtipo_asentamiento),

);

select asentamiento,idtipo_asentamiento,tipo_asentamiento from cps


select * from Asentamientos
--ALTER TABLE Asentamientos
--ADD CONSTRAINT uq_asentamiento_tipo
--UNIQUE(asentamiento, idtipo_asentamiento);
insert into Asentamientos(asentamiento,idtipo_asentamiento)
SELECT DISTINCT asentamiento, idtipo_asentamiento
FROM cps
WHERE asentamiento is not null
--Municipios

select * from municipios ORDER BY idestado, municipio
-- 1. Crear tabla
CREATE TABLE municipios (
    id_municipio INT IDENTITY(1,1) PRIMARY KEY,
    municipio VARCHAR(150),
    id_estado SMALLINT,
    CONSTRAINT fk_estados 
        FOREIGN KEY (id_estado) REFERENCES Estados(idestado),
    CONSTRAINT municipio_estado 
        UNIQUE (municipio, id_estado)
);

-- 2. Insertar datos
INSERT INTO municipios (municipio, id_estado)
SELECT DISTINCT municipio, idestado
FROM cps;

--Ciudades
CREATE TABLE ciudades (
    id_ciudad INT IDENTITY(1,1) PRIMARY KEY,
    codigo_ciudad INT,
    ciudad VARCHAR(150) NOT NULL,
    id_municipio INT NOT NULL,

    CONSTRAINT fk_ciudad_municipio
        FOREIGN KEY (id_municipio)
        REFERENCES municipios(id_municipio),

    CONSTRAINT ciudad_unica
        UNIQUE (codigo_ciudad, ciudad, id_municipio)
);

SELECT *
FROM ciudades
INSERT INTO ciudades (codigo_ciudad, ciudad, id_municipio)
SELECT DISTINCT
    TRY_CAST(c.idciudad AS INT),
    c.ciudad,
    m.id_municipio
FROM cps c
JOIN municipios m
ON c.municipio = m.municipio
AND c.idestado = m.id_estado
WHERE TRY_CAST(c.idciudad AS INT) IS NOT NULL
AND c.idciudad <> '';

--zonas
CREATE TABLE zonas(
    id_zona INT IDENTITY(1,1) PRIMARY KEY,
    zona VARCHAR(50)
    
);

CREATE TABLE codigos_postales(
    idcp INT IDENTITY(1,1) PRIMARY KEY,
    cp NVARCHAR(5),

    id_asentamiento INT,
    id_municipio INT,
    id_ciudad INT,
    id_estado SMALLINT,
    id_tipo_asentamiento SMALLINT,

    FOREIGN KEY(id_asentamiento) REFERENCES Asentamientos(idasentamiento),

    FOREIGN KEY(id_municipio)
        REFERENCES municipios(id_municipio),

    FOREIGN KEY(id_ciudad)
        REFERENCES ciudades(id_ciudad),

    FOREIGN KEY(id_estado)
        REFERENCES estados(idestado),

    FOREIGN KEY(id_tipo_asentamiento)
        REFERENCES TipoAnsentamiento(idtipo_asentamiento)
);
--Insertar todos los datos a codigos_postales, JOIN es utilizado para traducir nombres a IDs
INSERT INTO codigos_postales
(cp, id_asentamiento, id_municipio, id_ciudad, id_estado, id_tipo_asentamiento)
SELECT DISTINCT
    c.cp,
    a.idasentamiento,
    m.id_municipio,  
    ci.id_ciudad,    
    e.idestado,      
    ta.idtipo_asentamiento
FROM cps c
LEFT JOIN Asentamientos a ON c.asentamiento = a.asentamiento AND c.idtipo_asentamiento = a.idtipo_asentamiento
LEFT JOIN municipios m ON c.municipio = m.municipio AND c.idestado = m.id_estado
LEFT JOIN ciudades ci ON TRY_CAST(c.idciudad AS INT) = ci.codigo_ciudad AND m.id_municipio = ci.id_municipio
LEFT JOIN Estados e ON c.idestado = e.idestado
LEFT JOIN TipoAnsentamiento ta ON c.idtipo_asentamiento = ta.idtipo_asentamiento
WHERE c.cp IS NOT NULL;
SELECT *
FROM empleados

DROP TABLE direcciones
CREATE TABLE direcciones (
    id_direccion INT IDENTITY(1,1) PRIMARY KEY,
    calle VARCHAR(150) NOT NULL,
    numero_exterior VARCHAR(20) NOT NULL,
    numero_interior VARCHAR(20) NULL,
    id_codigo_postal INT NOT NULL,  -- Este ahora apuntará a codigos_postales
    referencias VARCHAR(255) NULL,
    FOREIGN KEY (id_codigo_postal) REFERENCES codigos_postales(idcp)
);

CREATE TABLE personas (
    id_persona INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(20),
    celular VARCHAR(20),
    rfc VARCHAR(13) UNIQUE,
    curp VARCHAR(18) UNIQUE,
    fecha_nacimiento DATE,
    id_direccion INT,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_direccion) REFERENCES direcciones(id_direccion)
);

CREATE TABLE roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);
SELECT * FROM empleados
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_persona INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    activo BIT DEFAULT 1,
    ultimo_acceso DATETIME,
    FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);
-- Simplificar tabla usuarios (agrega columna password si no existe)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('usuarios') AND name = 'password')
BEGIN
    ALTER TABLE usuarios ADD password VARCHAR(100) NULL;
END
-- Agregar columna factor_precio a la tabla
ALTER TABLE tipos_cliente ADD factor_precio DECIMAL(5,3) NOT NULL DEFAULT 1.00;

-- Actualizar con tus factores específicos
UPDATE tipos_cliente SET factor_precio = 1.130 WHERE id_tipo_cliente = 1;  -- PUBLICO
UPDATE tipos_cliente SET factor_precio = 1.120 WHERE id_tipo_cliente = 2;  -- HERRERO 2
UPDATE tipos_cliente SET factor_precio = 1.110 WHERE id_tipo_cliente = 1002;  -- HERRERO 3
UPDATE tipos_cliente SET factor_precio = 1.100 WHERE id_tipo_cliente = 1003;  -- HERRERO 4
UPDATE tipos_cliente SET factor_precio = 1.095 WHERE id_tipo_cliente = 3;  -- MAYOREO 1
UPDATE tipos_cliente SET factor_precio = 1.090 WHERE id_tipo_cliente = 4;  -- MAYOREO 2
select * from tipos_cliente

UPDATE tipos_cliente
SET nombre_tipo = 'Herrero 3'
WHERE id_tipo_cliente = 1003;
-- Insertar los 6 tipos correctos
INSERT INTO tipos_cliente (nombre_tipo, descuento_base, requiere_volumen_minimo, volumen_minimo) VALUES
('HERRERO 2', 0, 0, 0),      -- Factor 1.11
('HERRERO 3', 0, 0, 0);    -- Factor 1.10

-- Verificar
SELECT id_tipo_cliente, nombre_tipo, factor_precio, descuento_base, requiere_volumen_minimo, volumen_minimo
FROM tipos_cliente
ORDER BY id_tipo_cliente;
CREATE TABLE tipos_cliente (
    id_tipo_cliente INT IDENTITY(1,1) PRIMARY KEY,
    nombre_tipo VARCHAR(50) NOT NULL UNIQUE,
    descuento_base DECIMAL(5,2) DEFAULT 0,
    requiere_volumen_minimo BIT DEFAULT 0,
    volumen_minimo INT DEFAULT 0
);

CREATE TABLE clientes (
    id_cliente INT IDENTITY(1,1) PRIMARY KEY,
    id_persona INT NOT NULL,
    id_tipo_cliente INT NOT NULL,
    fecha_registro DATETIME DEFAULT GETDATE(),
    ultima_compra DATETIME NULL,
    total_compras DECIMAL(18,2) DEFAULT 0,
    factor_descuento_extra DECIMAL(5,2) DEFAULT 0,
    credito_autorizado BIT DEFAULT 0,
    limite_credito DECIMAL(18,2) DEFAULT 0,
    activo BIT DEFAULT 1,
    FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
    FOREIGN KEY (id_tipo_cliente) REFERENCES tipos_cliente(id_tipo_cliente)
);

CREATE TABLE puestos (
    id_puesto INT IDENTITY(1,1) PRIMARY KEY,
    nombre_puesto VARCHAR(100) NOT NULL,
    salario_base DECIMAL(10,2),
    descripcion VARCHAR(255)
);

CREATE TABLE empleados (
    id_empleado INT IDENTITY(1,1) PRIMARY KEY,
    id_persona INT NOT NULL,
    id_puesto INT NOT NULL,
    numero_empleado VARCHAR(20) UNIQUE,
    fecha_contratacion DATE NOT NULL,
    salario DECIMAL(10,2),
    comision_por_venta DECIMAL(5,2) DEFAULT 0,
    activo BIT DEFAULT 1,
    FOREIGN KEY (id_persona) REFERENCES personas(id_persona),
    FOREIGN KEY (id_puesto) REFERENCES puestos(id_puesto)
);

-- ======================================================
-- 2. PRODUCTOS E INVENTARIO
-- ======================================================

CREATE TABLE categorias (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

SELECT * FROM categorias
CREATE TABLE productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    nombre_producto VARCHAR(200) NOT NULL,
    descripcion VARCHAR(500),
    id_categoria INT NOT NULL,
    sku VARCHAR(50) UNIQUE,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 10,
    stock_maximo INT NULL,
    precio_base DECIMAL(18,2) NOT NULL,
    unidad_medida VARCHAR(20) DEFAULT 'PZA',
    peso_kg DECIMAL(10,2) NULL,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE impuestos (
    id_impuesto INT IDENTITY(1,1) PRIMARY KEY,
    nombre_impuesto VARCHAR(50) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    tipo_impuesto VARCHAR(10) CHECK (tipo_impuesto IN ('IVA', 'IEPS')),
    activo BIT DEFAULT 1
);

CREATE TABLE producto_impuesto (
    id_producto_impuesto INT IDENTITY(1,1) PRIMARY KEY,
    id_producto INT NOT NULL,
    id_impuesto INT NOT NULL,
    aplica BIT DEFAULT 1,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_impuesto) REFERENCES impuestos(id_impuesto)
);

CREATE TABLE listas_precios (
    id_lista INT IDENTITY(1,1) PRIMARY KEY,
    id_tipo_cliente INT,
    nombre_lista VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    activo BIT DEFAULT 1
    FOREIGN KEY (id_tipo_cliente) REFERENCES tipos_cliente(id_tipo_cliente);
);

CREATE TABLE precios_por_lista (
    id_precio_lista INT IDENTITY(1,1) PRIMARY KEY,
    id_producto INT NOT NULL,
    id_lista INT NOT NULL,
    cantidad_minima INT NOT NULL DEFAULT 1,
    cantidad_maxima INT NULL,
    precio_unitario DECIMAL(18,2) NOT NULL,
    activo BIT DEFAULT 1,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_lista) REFERENCES listas_precios(id_lista),
    CHECK (cantidad_minima > 0),
    CHECK (cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima)
);

CREATE TABLE tipos_movimiento (
    id_tipo_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    nombre_movimiento VARCHAR(50) NOT NULL,
    signo INT DEFAULT 1,
    afecta_stock BIT DEFAULT 1
);

CREATE TABLE movimientos_inventario (
    id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_producto INT NOT NULL,
    id_tipo_movimiento INT NOT NULL,
    cantidad INT NOT NULL,
    stock_antes INT NOT NULL,
    stock_despues INT NOT NULL,
    referencia_tabla VARCHAR(50),
    referencia_id INT,
    observaciones VARCHAR(500),
    fecha_movimiento DATETIME DEFAULT GETDATE(),
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_tipo_movimiento) REFERENCES tipos_movimiento(id_tipo_movimiento),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ======================================================
-- 3. VENTAS (SIN MÉTODOS DE PAGO)
-- ======================================================
-- --------------------------------------------------------------------------------------------------------------- Verificar esta parte y cambiar por los nombre correctos
ALTER TABLE productos ADD 
peso_anterior_kg DECIMAL(10,2) NULL,
peso_actual_kg DECIMAL(10,2) NULL,
fecha_ultimo_peso DATETIME DEFAULT GETDATE(),
fecha_peso_anterior DATETIME DEFAULT GETDATE(),
usuario_ultima_actualizacion INT NULL,
metodo_promedio VARCHAR(20) DEFAULT 'Promedio' CHECK (metodo_promedio IN ('Promedio', 'Último'));


SELECT * FROM productos
CREATE TABLE historial_pesos(
id_historial_peso INT IDENTITY(1,1) PRIMARY KEY,
id_producto INT NOT NULL,
peso_anterior DECIMAL(10,2) NOT NULL,
peso_nuevo DECIMAL(10,2) NOT NULL,
fecha_cambio DATETIME DEFAULT GETDATE(),
id_usuario INT NOT NULL,
lote VARCHAR(50),
proveedor VARCHAR(100),
observaciones VARCHAR(500),
FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
-- Crear la tabla de folios
CREATE TABLE folios (
    id_folio INT IDENTITY(1,1) PRIMARY KEY,
    tabla_nombre VARCHAR(50) NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    prefijo VARCHAR(10) NOT NULL,
    anio INT NOT NULL,
    CONSTRAINT UQ_folios_tabla_anio UNIQUE (tabla_nombre, anio)
);
GO


CREATE TABLE metodos_pago (
    id_metodo_pago INT IDENTITY(1,1) PRIMARY KEY,
    nombre_metodo VARCHAR(50) NOT NULL,
    requiere_datos_extra BIT DEFAULT 0
);

CREATE TABLE ventas (
    id_venta INT IDENTITY(1,1) PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    id_cliente INT NOT NULL,
    id_empleado INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    fecha_venta DATETIME DEFAULT GETDATE(),
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    descuento_total DECIMAL(18,2) DEFAULT 0,
    iva DECIMAL(18,2) DEFAULT 0,
    ieps DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) NOT NULL DEFAULT 0,
    flete DECIMAL(18,2) DEFAULT 0,
    seguro_descarga DECIMAL(18,2) DEFAULT 0,
    observaciones VARCHAR(500),
    cancelada BIT DEFAULT 0,
    fecha_cancelacion DATETIME NULL,
    motivo_cancelacion VARCHAR(255) NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
    FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago)
);

CREATE TABLE detalle_venta (
    id_detalle_venta INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(18,2) NOT NULL,
    descuento_linea DECIMAL(18,2) DEFAULT 0,
    iva_aplicado DECIMAL(5,2) DEFAULT 16,
    ieps_aplicado DECIMAL(5,2) DEFAULT 0,
    subtotal_linea DECIMAL(18,2) NOT NULL,
    total_linea DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    CHECK (cantidad > 0)
);
CREATE TABLE transferencias (
    id_transferencia INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT NOT NULL,
    banco_emisor VARCHAR(100) NOT NULL,
    banco_receptor VARCHAR(100) NOT NULL,
    cuenta_origen VARCHAR(50) NOT NULL,
    cuenta_destino VARCHAR(50) NOT NULL,
    referencia VARCHAR(100) NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    fecha_transferencia DATETIME NOT NULL,
    comprobante_url VARCHAR(500),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta)
);

CREATE TABLE gastos_venta (
    id_gasto INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT NOT NULL,
    tipo_gasto VARCHAR(30) NOT NULL CHECK (tipo_gasto IN ('FLETE', 'SEGURO_DESCARGA', 'PRECIO_DESCARGA')),
    monto DECIMAL(18,2) NOT NULL,
    id_empleado_asignado INT NULL,
    observaciones VARCHAR(255),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_empleado_asignado) REFERENCES empleados(id_empleado)
);

-- ======================================================
-- 4. PEDIDOS
-- ======================================================

CREATE TABLE estados_pedido (
    id_estado INT IDENTITY(1,1) PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL,
    orden INT DEFAULT 0
);

CREATE TABLE pedidos (
    id_pedido INT IDENTITY(1,1) PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    id_cliente INT NOT NULL,
    id_empleado INT NOT NULL,
    fecha_pedido DATETIME DEFAULT GETDATE(),
    fecha_entrega_estimada DATE,
    fecha_entrega_real DATE NULL,
    id_estado INT NOT NULL,
    subtotal DECIMAL(18,2) NOT NULL,
    total DECIMAL(18,2) NOT NULL,
    observaciones VARCHAR(500),
    activo BIT DEFAULT 1,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
    FOREIGN KEY (id_estado) REFERENCES estados_pedido(id_estado)
);

CREATE TABLE detalle_pedido (
    id_detalle_pedido INT IDENTITY(1,1) PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(18,2) NOT NULL,
    subtotal_linea DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE historial_pedido (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_estado_anterior INT,
    id_estado_nuevo INT NOT NULL,
    fecha_cambio DATETIME DEFAULT GETDATE(),
    observaciones VARCHAR(500),
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_estado_anterior) REFERENCES estados_pedido(id_estado),
    FOREIGN KEY (id_estado_nuevo) REFERENCES estados_pedido(id_estado),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
-- ======================================================
-- 5. DEVOLUCIONES
-- ======================================================

CREATE TABLE devoluciones (
    id_devolucion INT IDENTITY(1,1) PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    id_venta INT NOT NULL,
    id_cliente INT NOT NULL,
    fecha_devolucion DATETIME DEFAULT GETDATE(),
    tipo_devolucion VARCHAR(20) CHECK (tipo_devolucion IN ('TOTAL', 'PARCIAL')),
    monto_reembolsado DECIMAL(18,2) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    autorizada_por INT NOT NULL,
    cancelada BIT DEFAULT 0,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (autorizada_por) REFERENCES empleados(id_empleado)
);

CREATE TABLE detalle_devolucion (
    id_detalle_devolucion INT IDENTITY(1,1) PRIMARY KEY,
    id_devolucion INT NOT NULL,
    id_detalle_venta INT NOT NULL,
    cantidad INT NOT NULL,
    motivo_detalle VARCHAR(500),
    FOREIGN KEY (id_devolucion) REFERENCES devoluciones(id_devolucion),
    FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta)
);

-- ======================================================
-- 6. AUDITORÍA Y FOLIOS
-- ======================================================

CREATE TABLE auditoria (
    id_auditoria INT IDENTITY(1,1) PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id INT NOT NULL,
    datos_anteriores TEXT NULL,
    datos_nuevos TEXT NULL,
    fecha DATETIME DEFAULT GETDATE(),
    ip_address VARCHAR(45) NULL
);

CREATE TABLE folios (
    id_folio INT IDENTITY(1,1) PRIMARY KEY,
    tabla_nombre VARCHAR(50) NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    prefijo VARCHAR(10) NOT NULL,
    anio INT NOT NULL,
    UNIQUE (tabla_nombre, anio)
);

-- ======================================================
-- DCL - CREACIÓN DE USUARIOS Y PERMISOS
-- ======================================================

-- Crear LOGIN a nivel servidor
CREATE LOGIN aceros_admin WITH PASSWORD = 'Aceros4!';
CREATE LOGIN aceros_ventas WITH PASSWORD = 'Ventas3!';
CREATE LOGIN aceros_consulta WITH PASSWORD = 'Consulta2!';

-- Crear USUARIOS en la base de datos

CREATE USER aceros_admin FOR LOGIN aceros_admin;
CREATE USER aceros_ventas FOR LOGIN aceros_ventas;
CREATE USER aceros_consulta FOR LOGIN aceros_consulta;

-- Asignar roles y permisos

-- ADMIN: Control total (INSERT, UPDATE, DELETE, SELECT, EXECUTE)
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO aceros_admin;
GRANT EXECUTE ON SCHEMA::dbo TO aceros_admin;

-- VENTAS: Solo puede hacer ventas y ver clientes
GRANT SELECT, INSERT ON ventas TO aceros_ventas;
GRANT SELECT, INSERT ON detalle_venta TO aceros_ventas;
GRANT SELECT ON clientes TO aceros_ventas;
GRANT SELECT ON productos TO aceros_ventas;
GRANT SELECT ON personas TO aceros_ventas;
GRANT EXECUTE ON dbo.sp_RegistrarVenta TO aceros_ventas;
GRANT EXECUTE ON dbo.sp_RegistrarDevolucion TO aceros_ventas;
GRANT SELECT ON dbo.vw_VentasCompletas TO aceros_ventas;

-- CONSULTA: Solo puede leer reportes
GRANT SELECT ON dbo.vw_VentasCompletas TO aceros_consulta;
GRANT SELECT ON dbo.vw_ProductosStockBajo TO aceros_consulta;
GRANT SELECT ON dbo.vw_ReporteEmpleadosVentas TO aceros_consulta;
GRANT SELECT ON dbo.vw_PedidosPendientes TO aceros_consulta;
GRANT SELECT ON dbo.vw_DevolucionesDetalle TO aceros_consulta;

-- Denegar permisos específicos
DENY DELETE ON ventas TO aceros_consulta;
DENY UPDATE ON productos TO aceros_ventas;


-- ======================================================
-- 7. TIPOS DE TABLA (TVP)
-- ======================================================
-- TVP para detalle de venta
CREATE TYPE dbo.TVP_DetalleVenta AS TABLE (
    id_producto INT,
    cantidad INT,
    precio_unitario DECIMAL(18,2),  -- opcional, se puede calcular
    descuento_linea DECIMAL(18,2) DEFAULT 0
);
GO

-- TVP para detalle de devolución
CREATE TYPE dbo.TVP_DetalleDevolucion AS TABLE (
    id_detalle_venta INT,
    cantidad INT
);
GO

-- TVP para detalle de pedido
CREATE TYPE dbo.TVP_DetallePedido AS TABLE (
    id_producto INT,
    cantidad INT,
    precio_unitario DECIMAL(18,2)
);
GO

-- Crear tabla de costos logísticos
CREATE TABLE costos_logisticos (
    id_costo INT IDENTITY(1,1) PRIMARY KEY,
    tipo_costo VARCHAR(20) NOT NULL CHECK (tipo_costo IN ('FLETE', 'SEGURO', 'DESCARGA')),
    costo_por_kg DECIMAL(10,4) NOT NULL,
    activo BIT DEFAULT 1,
    fecha_actualizacion DATETIME DEFAULT GETDATE()
);

-- Insertar los valores que usas
INSERT INTO costos_logisticos (tipo_costo, costo_por_kg, activo) VALUES
('FLETE', 0.30, 1),
('SEGURO', 0.10, 1),
('DESCARGA', 0.13, 1);  -- Nota: usaste 0.13 en tu ejemplo

-- Verificar
SELECT * FROM costos_logisticos WHERE activo = 1;
-- Agregar columna fecha_creacion a la tabla usuarios
ALTER TABLE usuarios ADD fecha_creacion DATETIME DEFAULT GETDATE();

-- Actualizar registros existentes con fecha actual
UPDATE usuarios SET fecha_creacion = GETDATE() WHERE fecha_creacion IS NULL;
-- ======================================================
-- 8. FUNCIONES
-- ======================================================

-- Crear la función que recibe un código postal y devuelve los detalles

CREATE FUNCTION buscar_cp(@cp NVARCHAR(5))
RETURNS TABLE
AS
RETURN
(
    SELECT
        cp.cp AS CodigoPostal,

        a.asentamiento, 
        ta.tipo_asentamiento,
        
        m.municipio,

        COALESCE(ci.ciudad, m.municipio) AS ciudad,

        e.estado,

         (
            SELECT TOP 1 zona
            FROM cps
            WHERE cps.cp = cp.cp
        ) AS zona


    FROM codigos_postales cp

    LEFT JOIN Asentamientos a
        ON cp.id_asentamiento = a.idasentamiento

    LEFT JOIN TipoAnsentamiento ta
        ON cp.id_tipo_asentamiento = ta.idtipo_asentamiento

    LEFT JOIN municipios m
        ON cp.id_municipio = m.id_municipio

    LEFT JOIN ciudades ci
        ON cp.id_ciudad = ci.id_ciudad

    LEFT JOIN estados e
        ON cp.id_estado = e.idestado

    WHERE cp.cp = @cp
);

SELECT * 
FROM buscar_cp('22127');

CREATE FUNCTION CalcularIVA(
    @monto DECIMAL(18,2),
    @porcentaje_iva DECIMAL(5,2) = 16  -- Por defecto 16% IVA
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @iva DECIMAL(18,2);
    
    IF @monto IS NULL OR @monto <= 0
        SET @iva = 0;
    ELSE
        SET @iva = @monto * (@porcentaje_iva / 100);
    
    RETURN ROUND(@iva, 2);
END;

CREATE FUNCTION ObtenerStockDisponible(
@id_producto INT)
RETURNS INT
AS
BEGIN
	DECLARE @stock_actual INT;
SELECT @stock_actual=stock_actual
FROM productos
WHERE id_producto = @id_producto AND activo=1;

RETURN ISNULL(@stock_actual, 0);
END;

-- Función para calcular costo final del producto basado en peso
CREATE FUNCTION CalcularCostoFinal(
    @costo_base DECIMAL(18,2),
    @peso_kg DECIMAL(10,2),
    @incluir_flete BIT = 1,
    @incluir_seguro BIT = 1,
    @incluir_descarga BIT = 1
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @costo_neto DECIMAL(18,2);
    DECLARE @costo_flete DECIMAL(18,2) = 0;
    DECLARE @costo_seguro DECIMAL(18,2) = 0;
    DECLARE @costo_descarga DECIMAL(18,2) = 0;
    DECLARE @subtotal DECIMAL(18,2);
    DECLARE @iva DECIMAL(18,2);
    
    -- Calcular cargos por peso ($0.30 por kg para flete)
    IF @incluir_flete = 1 AND @peso_kg > 0
        SET @costo_flete = @peso_kg * 0.30;
    
    -- Seguro ($0.10 por kg)
    IF @incluir_seguro = 1 AND @peso_kg > 0
        SET @costo_seguro = @peso_kg * 0.10;
    
    -- Descarga ($0.12 por kg)
    IF @incluir_descarga = 1 AND @peso_kg > 0
        SET @costo_descarga = @peso_kg * 0.12;
    
    -- Calcular subtotal
    SET @subtotal = @costo_base + @costo_flete + @costo_seguro + @costo_descarga;
    
    -- Aplicar IVA (16%)
    SET @iva = @subtotal * 0.16;
    
    -- Costo final con IVA
    SET @costo_neto = @subtotal + @iva;
    
    RETURN ROUND(@costo_neto, 2);
END;
GO

CREATE OR ALTER FUNCTION fn_CalcularDescuentoCliente(
    @id_cliente INT,
    @subtotal DECIMAL(18,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @descuento DECIMAL(18,2) = 0;
    DECLARE @descuento_base DECIMAL(5,2) = 0;
    DECLARE @descuento_extra DECIMAL(5,2) = 0;
    
    SELECT 
        @descuento_base = tc.descuento_base,
        @descuento_extra = c.factor_descuento_extra
    FROM clientes c
    INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
    WHERE c.id_cliente = @id_cliente;
    
    SET @descuento = @subtotal * (@descuento_base + @descuento_extra) / 100;
    
    RETURN ROUND(@descuento, 2);
END
GO
--------------------------------------------------------------------------------------------------------------------------------------
-- Función para calcular el peso promedio (ponderado por volumen de compra)
CREATE FUNCTION CalcularPesoPromedio(
    @id_producto INT,
    @tipo_promedio VARCHAR(20) = 'PROMEDIO'  -- PROMEDIO, ULTIMO, PONDERADO
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @peso_final DECIMAL(10,2);
    DECLARE @peso_actual DECIMAL(10,2);
    DECLARE @peso_anterior DECIMAL(10,2);
    DECLARE @fecha_actual DATETIME;
    DECLARE @fecha_anterior DATETIME;
    
    SELECT 
        @peso_actual = peso_actual_kg,
        @peso_anterior = peso_anterior_kg,
        @fecha_actual = fecha_ultimo_peso,
        @fecha_anterior = fecha_peso_anterior
    FROM productos
    WHERE id_producto = @id_producto;
    
    IF @tipo_promedio = 'ULTIMO'
    BEGIN
        SET @peso_final = ISNULL(@peso_actual, 0);
    END
    ELSE IF @tipo_promedio = 'PROMEDIO_SIMPLE'
    BEGIN
        -- Promedio simple entre peso anterior y actual
        IF @peso_anterior IS NOT NULL
            SET @peso_final = (@peso_actual + @peso_anterior) / 2;
        ELSE
            SET @peso_final = @peso_actual;
    END
    ELSE IF @tipo_promedio = 'PONDERADO'
    BEGIN
        -- Promedio ponderado por tiempo (más peso al registro más reciente)
        IF @peso_anterior IS NOT NULL AND @fecha_anterior IS NOT NULL
        BEGIN
            DECLARE @dias_diferencia INT;
            DECLARE @factor_actual DECIMAL(5,2);
            DECLARE @factor_anterior DECIMAL(5,2);
            
            SET @dias_diferencia = DATEDIFF(DAY, @fecha_anterior, @fecha_actual);
            
            -- Si es reciente (menos de 30 días), dar más peso al actual
            IF @dias_diferencia <= 30
            BEGIN
                SET @factor_actual = 0.7;
                SET @factor_anterior = 0.3;
            END
            ELSE IF @dias_diferencia <= 90
            BEGIN
                SET @factor_actual = 0.6;
                SET @factor_anterior = 0.4;
            END
            ELSE
            BEGIN
                SET @factor_actual = 0.5;
                SET @factor_anterior = 0.5;
            END
            
            SET @peso_final = (@peso_actual * @factor_actual) + 
                             (@peso_anterior * @factor_anterior);
        END
        ELSE
            SET @peso_final = @peso_actual;
    END
    
    RETURN ROUND(ISNULL(@peso_final, 0), 2);
END;



-- Procedimiento para actualizar peso cuando llega nueva tanda
CREATE PROCEDURE sp_ActualizarPesoProducto
    @id_producto INT,
    @nuevo_peso_kg DECIMAL(10,2),
    @id_usuario INT,
    @lote VARCHAR(50) = NULL,
    @proveedor VARCHAR(100) = NULL,
    @observaciones VARCHAR(500) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @peso_actual_actual DECIMAL(10,2);
        DECLARE @fecha_actual DATETIME;
        
        -- Obtener peso actual antes de actualizar
        SELECT 
            @peso_actual_actual = peso_actual_kg,
            @fecha_actual = GETDATE()
        FROM productos
        WHERE id_producto = @id_producto;
        
        -- Guardar el peso actual como anterior
        UPDATE productos
        SET 
            peso_anterior_kg = peso_actual_kg,
            peso_actual_kg = @nuevo_peso_kg,
            fecha_peso_anterior = fecha_ultimo_peso,
            fecha_ultimo_peso = @fecha_actual,
            usuario_ultima_actualizacion = @id_usuario
        WHERE id_producto = @id_producto;
        
        -- Registrar en historial
        INSERT INTO historial_pesos_productos (
            id_producto, 
            peso_anterior, 
            peso_nuevo, 
            id_usuario,
            lote,
            proveedor,
            observaciones
        )
        VALUES (
            @id_producto,
            @peso_actual_actual,
            @nuevo_peso_kg,
            @id_usuario,
            @lote,
            @proveedor,
            @observaciones
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar información actualizada
        SELECT 
            id_producto,
            peso_anterior_kg,
            peso_actual_kg,
            fecha_peso_anterior,
            fecha_ultimo_peso,
            'Peso actualizado exitosamente' AS mensaje
        FROM productos
        WHERE id_producto = @id_producto;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
-- ESTA ES LA MERA COCACOLA DEL DESIERTO

CREATE OR ALTER FUNCTION dbo.ObtenerCostoLogisticoPorKG()
RETURNS DECIMAL(10,4)
AS
BEGIN
    DECLARE @total_logistico DECIMAL(10,4);
    
    SELECT @total_logistico = ISNULL(SUM(costo_por_kg), 0)
    FROM costos_logisticos
    WHERE activo = 1;
    
    RETURN @total_logistico;
END;
GO
CREATE OR ALTER FUNCTION dbo.CalcularCostoNeto(
    @costo_base DECIMAL(18,2),
    @peso_kg DECIMAL(10,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @costo_logistico_por_kg DECIMAL(10,4);
    DECLARE @costo_logistico_total DECIMAL(18,2);
    DECLARE @costo_con_logistica DECIMAL(18,2);
    DECLARE @costo_con_iva DECIMAL(18,2);
    
    -- Obtener costo logístico por KG
    SET @costo_logistico_por_kg = dbo.ObtenerCostoLogisticoPorKG();
    
    -- Calcular costo logístico total según el peso
    SET @costo_logistico_total = @peso_kg * @costo_logistico_por_kg;
    
    -- Sumar costo base
    SET @costo_con_logistica = @costo_base + @costo_logistico_total;
    
    -- Aplicar IVA (16%)
    SET @costo_con_iva = @costo_con_logistica * 1.16;
    
    RETURN ROUND(@costo_con_iva, 2);
END;

-- ======================================================
-- FUNCIÓN PARA CALCULAR PRECIO CON PESO PROMEDIO
-- ======================================================
SELECT id_estado, nombre_estado, orden FROM estados_pedido;
UPDATE estados_pedido 
SET nombre_estado = 'COTIZACION'
WHERE id_estado = 1;
DELETE FROM estados_pedido
where id_estado = 1007
12
1002-1007
CREATE OR ALTER FUNCTION dbo.CalcularPrecioConPeso(
    @id_producto INT,
    @id_tipo_cliente INT,
    @cantidad INT = 1,
    @usar_peso_promedio BIT = 1,
    @tipo_promedio VARCHAR(20) = 'PROMEDIO'
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @precio_final DECIMAL(18,2);
    DECLARE @costo_base DECIMAL(18,2);
    DECLARE @peso_producto DECIMAL(10,2);
    DECLARE @costo_logistico DECIMAL(18,2);
    DECLARE @precio_base DECIMAL(18,2);
    DECLARE @factor_cliente DECIMAL(5,3);
    
    -- Obtener costo base del producto
    SELECT @costo_base = ISNULL(precio_base, 0)
    FROM productos
    WHERE id_producto = @id_producto AND activo = 1;
    
    -- Obtener peso (usar peso_actual_kg si existe)
    SELECT @peso_producto = ISNULL(peso_actual_kg, ISNULL(peso_kg, 1))
    FROM productos
    WHERE id_producto = @id_producto;
    
    -- Si no hay peso válido, usar 1 como default
    IF @peso_producto IS NULL OR @peso_producto = 0
        SET @peso_producto = 1;
    
    -- Calcular costo logístico (flete + seguro + descarga) basado en peso
    SET @costo_logistico = (@peso_producto * 0.30) +  -- Flete
                          (@peso_producto * 0.10) +  -- Seguro
                          (@peso_producto * 0.12);   -- Descarga
    
    -- Costo base + logística
    SET @precio_base = @costo_base + @costo_logistico;
    
    -- Aplicar IVA (16%)
    SET @precio_base = @precio_base * 1.16;
    
    -- Aplicar factor según tipo de cliente
    SELECT @factor_cliente = CASE @id_tipo_cliente
        WHEN 1 THEN 1.13    -- PUBLICO
        WHEN 2 THEN 1.12    -- HERRERO 2
        WHEN 3 THEN 1.11    -- HERRERO 3
        WHEN 4 THEN 1.10    -- HERRERO 4
        WHEN 5 THEN 1.095   -- MAYOREO 1
        WHEN 6 THEN 1.09    -- MAYOREO 2
        ELSE 1.13
    END;
    
    -- Aplicar descuento por volumen
    IF @cantidad >= 100
        SET @factor_cliente = @factor_cliente * 0.95;
    ELSE IF @cantidad >= 50
        SET @factor_cliente = @factor_cliente * 0.97;
    ELSE IF @cantidad >= 25
        SET @factor_cliente = @factor_cliente * 0.98;
    
    SET @precio_final = @precio_base * @factor_cliente;
    
    RETURN ROUND(ISNULL(@precio_final, 0), 2);
END;
GO

-- Verificar que la función se creó correctamente
SELECT 
    name,
    type_desc,
    create_date
FROM sys.objects 
WHERE name = 'CalcularPrecioConPeso' 
AND type = 'FN';
GO

-- Probar la función
SELECT dbo.CalcularPrecioConPeso(1, 1, 1, 1, 'PROMEDIO') AS PrecioPrueba;

CREATE OR ALTER FUNCTION dbo.CalcularPrecioFinal(

    @id_producto INT,
    @id_tipo_cliente INT,
    @cantidad INT = 1,
    @usar_peso_promedio BIT = 1
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @costo_base DECIMAL(18,2);
    DECLARE @peso_producto DECIMAL(10,2);
    DECLARE @costo_neto DECIMAL(18,2);
    DECLARE @factor_cliente DECIMAL(5,3);
    DECLARE @precio_final DECIMAL(18,2);
    DECLARE @peso_actual DECIMAL(10,2);
    DECLARE @peso_anterior DECIMAL(10,2);
    
    -- Obtener costo base del producto
    SELECT @costo_base = precio_base
    FROM productos
    WHERE id_producto = @id_producto AND activo = 1;
    
    -- Obtener pesos del producto
    SELECT 
        @peso_actual = ISNULL(peso_actual_kg, peso_kg),
        @peso_anterior = peso_anterior_kg
    FROM productos
    WHERE id_producto = @id_producto;
    
    -- Calcular peso a usar (promedio o actual)
    IF @usar_peso_promedio = 1 AND @peso_anterior IS NOT NULL
        SET @peso_producto = (@peso_actual + @peso_anterior) / 2;
    ELSE
        SET @peso_producto = @peso_actual;
    
    -- Si no hay peso válido, usar 1 como default
    IF @peso_producto IS NULL OR @peso_producto = 0
        SET @peso_producto = 1;
    
    -- Obtener costo neto (costo base + logística + IVA) por KG
    SET @costo_neto = dbo.CalcularCostoNeto(@costo_base, 1); -- Por KG
    
    -- Obtener factor del cliente desde la tabla
    SELECT @factor_cliente = ISNULL(factor_precio, 1.13)
    FROM tipos_cliente
    WHERE id_tipo_cliente = @id_tipo_cliente;
    
    -- Si no se encontró, usar valor por defecto
    IF @factor_cliente IS NULL
        SET @factor_cliente = 1.13;
    
    -- Calcular precio final: peso × costo_neto × factor_cliente
    SET @precio_final = @peso_producto * @costo_neto * @factor_cliente;
    
    -- Aplicar descuento por volumen (opcional)
    IF @cantidad >= 100
        SET @precio_final = @precio_final * 0.95;  -- 5% descuento
    ELSE IF @cantidad >= 50
        SET @precio_final = @precio_final * 0.97;  -- 3% descuento
    ELSE IF @cantidad >= 25
        SET @precio_final = @precio_final * 0.98;  -- 2% descuento
    
    RETURN ROUND(@precio_final, 2);
END;

CREATE OR ALTER FUNCTION dbo.CalcularPrecioProducto(
    @id_producto INT,
    @id_tipo_cliente INT,
    @cantidad INT = 1
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    RETURN dbo.CalcularPrecioFinal(@id_producto, @id_tipo_cliente, @cantidad, 1);
END;

GO
GO
SELECT * FROM ventas WHERE id_venta = 3021;
SELECT v.id_venta, v.id_cliente, v.id_empleado, v.id_metodo_pago
FROM ventas v
WHERE v.id_venta = 3021;
SELECT *
FROM ventas v
INNER JOIN clientes c ON v.id_cliente = c.id_cliente
WHERE v.id_venta = 3021;
SELECT *
FROM ventas v
INNER JOIN empleados e ON v.id_empleado = e.id_empleado
WHERE v.id_venta = 3021;
SELECT *
FROM ventas v
INNER JOIN metodos_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
WHERE v.id_venta = 3021;
SELECT * FROM empleados WHERE id_empleado = 10;
GO

-- Eliminar si existen
DROP FUNCTION IF EXISTS fn_ObtenerPrecioProducto;
DROP FUNCTION IF EXISTS CalcularPrecioConPeso;
DROP FUNCTION IF EXISTS CalcularPrecioConPesoDinamico;
DROP FUNCTION IF EXISTS CalcularCostoFinal;  -- (la vieja, porque ya tenemos CalcularCostoNeto)
DROP FUNCTION IF EXISTS CalcularDescuentoCliente; -- (no la estás usando en el precio)

GO

-- Función para calcular costo final del producto basado en peso
CREATE FUNCTION CalcularCostoFinal(
    @costo_base DECIMAL(18,2),
    @peso_kg DECIMAL(10,2),
    @incluir_flete BIT = 1,
    @incluir_seguro BIT = 1,
    @incluir_descarga BIT = 1
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @costo_neto DECIMAL(18,2);
    DECLARE @costo_flete DECIMAL(18,2) = 0;
    DECLARE @costo_seguro DECIMAL(18,2) = 0;
    DECLARE @costo_descarga DECIMAL(18,2) = 0;
    DECLARE @subtotal DECIMAL(18,2);
    DECLARE @iva DECIMAL(18,2);
    
    -- Calcular cargos por peso ($0.30 por kg para flete)
    IF @incluir_flete = 1 AND @peso_kg > 0
        SET @costo_flete = @peso_kg * 0.30;
    
    -- Seguro ($0.10 por kg)
    IF @incluir_seguro = 1 AND @peso_kg > 0
        SET @costo_seguro = @peso_kg * 0.10;
    
    -- Descarga ($0.12 por kg)
    IF @incluir_descarga = 1 AND @peso_kg > 0
        SET @costo_descarga = @peso_kg * 0.12;
    
    -- Calcular subtotal
    SET @subtotal = @costo_base + @costo_flete + @costo_seguro + @costo_descarga;
    
    -- Aplicar IVA (16%)
    SET @iva = @subtotal * 0.16;
    
    -- Costo final con IVA
    SET @costo_neto = @subtotal + @iva;
    
    RETURN ROUND(@costo_neto, 2);
END;
GO
-- Función para calcular descuento según tipo de cliente
CREATE FUNCTION CalcularDescuentoCliente(
    @id_cliente INT,
    @monto_original DECIMAL(18,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @descuento DECIMAL(18,2);
    DECLARE @id_tipo_cliente INT;
    DECLARE @descuento_base DECIMAL(5,2);
    DECLARE @descuento_extra DECIMAL(5,2);
    DECLARE @total_compras DECIMAL(18,2);
    
    -- Obtener datos del cliente
    SELECT 
        @id_tipo_cliente = tc.id_tipo_cliente,
        @descuento_base = tc.descuento_base,
        @descuento_extra = c.factor_descuento_extra,
        @total_compras = c.total_compras
    FROM clientes c
    INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
    WHERE c.id_cliente = @id_cliente;
    
    -- Calcular descuento base
    SET @descuento = (@monto_original * @descuento_base / 100);
    
    -- Aplicar descuento extra
    IF @descuento_extra > 0
        SET @descuento = @descuento + (@monto_original * @descuento_extra / 100);
    
    -- Descuento adicional por volumen de compras (ejemplo)
    IF @total_compras > 50000
        SET @descuento = @descuento + (@monto_original * 2 / 100);
    ELSE IF @total_compras > 25000
        SET @descuento = @descuento + (@monto_original * 1 / 100);
    
    RETURN ROUND(@descuento, 2);
END;
GO
-- ======================================================
-- 9. VISTAS
-- ======================================================

CREATE VIEW vw_VentasCompletas AS
SELECT 
    v.id_venta,
    v.folio,
    p.nombre + ' ' + p.apellido_paterno AS cliente,
    emp.numero_empleado AS vendedor,---------------------------------------------
    v.fecha_venta,
    v.subtotal,
    v.iva,
    v.ieps,
    v.total,
    v.cancelada
FROM ventas v
INNER JOIN clientes c ON v.id_cliente = c.id_cliente
INNER JOIN personas p ON c.id_persona = p.id_persona
INNER JOIN empleados emp ON v.id_empleado = emp.id_empleado
INNER JOIN personas e ON emp.id_persona = e.id_persona
WHERE v.cancelada = 0


CREATE VIEW vw_ProductosStockBajo AS
SELECT 
    id_producto,
    nombre_producto,
    stock_actual,
    stock_minimo,
    (stock_minimo - stock_actual) AS faltante_para_minimo,
    CASE 
        WHEN stock_actual <= 0 THEN 'CRÍTICO'
        WHEN stock_actual < stock_minimo THEN 'BAJO'
        ELSE 'NORMAL'
    END AS nivel_stock
FROM productos
WHERE stock_actual < stock_minimo


CREATE VIEW vw_ReporteEmpleadosVentas AS
SELECT 
    e.id_empleado,
    p.nombre + ' ' + p.apellido_paterno AS empleado,
    COUNT(v.id_venta) AS total_ventas,
    SUM(v.total) AS monto_total,
    AVG(v.total) AS promedio_venta,
    MIN(v.total) AS venta_minima,
    MAX(v.total) AS venta_maxima,
    YEAR(v.fecha_venta) AS anio,
    MONTH(v.fecha_venta) AS mes
FROM empleados e
INNER JOIN personas p ON e.id_persona = p.id_persona
INNER JOIN ventas v ON e.id_empleado = v.id_empleado
WHERE v.cancelada = 0
GROUP BY e.id_empleado, p.nombre, p.apellido_paterno, YEAR(v.fecha_venta), MONTH(v.fecha_venta)

CREATE VIEW vw_PedidosPendientes AS
SELECT 
    pe.id_pedido,
    pe.folio,
    cl.nombre_completo AS cliente,
    pe.fecha_pedido,
    pe.fecha_entrega_estimada,
    DATEDIFF(DAY, GETDATE(), pe.fecha_entrega_estimada) AS dias_para_entregar,
    ep.nombre_estado,
    pe.total
FROM pedidos pe
INNER JOIN (
    SELECT c.id_cliente, p.nombre + ' ' + p.apellido_paterno AS nombre_completo
    FROM clientes c
    INNER JOIN personas p ON c.id_persona = p.id_persona
) cl ON pe.id_cliente = cl.id_cliente
INNER JOIN estados_pedido ep ON pe.id_estado = ep.id_estado
WHERE ep.nombre_estado NOT IN ('ENTREGADO', 'CANCELADO')


CREATE VIEW vw_DevolucionesDetalle AS
SELECT 
    d.id_devolucion,
    d.folio AS folio_devolucion,
    v.folio AS folio_venta,
    p.nombre + ' ' + p.apellido_paterno AS cliente,
    d.fecha_devolucion,
    d.tipo_devolucion,
    d.monto_reembolsado,
    d.motivo,
    autorizador.nombre_empleado AS autorizado_por
FROM devoluciones d
INNER JOIN ventas v ON d.id_venta = v.id_venta
INNER JOIN clientes c ON d.id_cliente = c.id_cliente
INNER JOIN personas p ON c.id_persona = p.id_persona
INNER JOIN (
    SELECT emp.id_empleado, per.nombre + ' ' + per.apellido_paterno AS nombre_empleado
    FROM empleados emp
    INNER JOIN personas per ON emp.id_persona = per.id_persona
) autorizador ON d.autorizada_por = autorizador.id_empleado
WHERE d.cancelada = 0
GO

-- Vista que muestra precios calculados con peso promedio para cada tipo de cliente
CREATE VIEW vw_PreciosProductosPorCliente AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    p.sku,
    p.peso_actual_kg AS peso_actual,
    p.peso_anterior_kg AS peso_anterior,
    dbo.CalcularPesoPromedio(p.id_producto, 'PROMEDIO') AS peso_promedio,
    dbo.CalcularPesoPromedio(p.id_producto, 'PONDERADO') AS peso_ponderado,
    p.precio_base AS costo_base,
    tc.id_tipo_cliente,
    tc.nombre_tipo,
    -- Precios calculados con diferentes métodos
    dbo.CalcularPrecioConPesoDinamico(p.id_producto, tc.id_tipo_cliente, 1, 1, 'PROMEDIO') AS precio_promedio,
    dbo.CalcularPrecioConPesoDinamico(p.id_producto, tc.id_tipo_cliente, 1, 1, 'PONDERADO') AS precio_ponderado,
    dbo.CalcularPrecioConPesoDinamico(p.id_producto, tc.id_tipo_cliente, 1, 0, 'ULTIMO') AS precio_actual,
    -- Precios por volumen
    dbo.CalcularPrecioConPesoDinamico(p.id_producto, tc.id_tipo_cliente, 25, 1, 'PONDERADO') AS precio_25_piezas,
    dbo.CalcularPrecioConPesoDinamico(p.id_producto, tc.id_tipo_cliente, 50, 1, 'PONDERADO') AS precio_50_piezas,
    dbo.CalcularPrecioConPesoDinamico(p.id_producto, tc.id_tipo_cliente, 100, 1, 'PONDERADO') AS precio_100_piezas
FROM productos p
CROSS JOIN tipos_cliente tc
WHERE p.activo = 1 AND tc.id_tipo_cliente <= 6;  -- Solo tipos de cliente relevantes

-- ======================================================
-- 10. TRIGGERS
-- ======================================================

CREATE TRIGGER trg_AfterInsertDetalleVenta
ON detalle_venta
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN productos p ON i.id_producto = p.id_producto
        WHERE p.stock_actual < i.cantidad
    )
    BEGIN
        RAISERROR('Stock insuficiente para realizar la venta', 16, 1)
        ROLLBACK TRANSACTION
        RETURN
    END
    
    UPDATE p
    SET p.stock_actual = p.stock_actual - i.cantidad
    FROM productos p
    INNER JOIN inserted i ON p.id_producto = i.id_producto
    
    INSERT INTO movimientos_inventario (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, referencia_tabla, referencia_id, id_usuario)
    SELECT 
        i.id_producto,
        (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre_movimiento = 'VENTA'),
        i.cantidad,
        p.stock_actual + i.cantidad,
        p.stock_actual,
        'VENTA',
        i.id_venta,
        1
    FROM inserted i
    INNER JOIN productos p ON i.id_producto = p.id_producto
END

CREATE TRIGGER trg_AfterInsertDevolucion
ON detalle_devolucion
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- CORREGIDO: JOIN correcto sin producto cartesiano
    UPDATE p
    SET p.stock_actual = p.stock_actual + i.cantidad
    FROM productos p
    INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
    INNER JOIN inserted i ON dv.id_detalle_venta = i.id_detalle_venta
    
    -- Registrar movimiento de inventario
    INSERT INTO movimientos_inventario (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, referencia_tabla, referencia_id, observaciones, id_usuario)
    SELECT 
        p.id_producto,
        (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre_movimiento = 'DEVOLUCION'),
        i.cantidad,
        p.stock_actual - i.cantidad,
        p.stock_actual,
        'DEVOLUCION',
        i.id_devolucion,
        'Devolución registrada',
        1
    FROM productos p
    INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
    INNER JOIN inserted i ON dv.id_detalle_venta = i.id_detalle_venta
END

-- Trigger para registrar automáticamente cualquier cambio de peso
DROP TRIGGER IF EXISTS trg_RegistrarCambioPeso;
GO

CREATE TRIGGER trg_RegistrarCambioPeso
ON productos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(peso_actual_kg)
    BEGIN
        INSERT INTO historial_pesos (
            id_producto,
            peso_anterior,
            peso_nuevo,
            id_usuario,
            observaciones
        )
        SELECT 
            i.id_producto,
            ISNULL(d.peso_actual_kg, ISNULL(d.peso_kg, 0)),
            ISNULL(i.peso_actual_kg, 0),
            ISNULL(i.usuario_ultima_actualizacion, 1),
            'Cambio automático por trigger'
        FROM inserted i
        INNER JOIN deleted d ON i.id_producto = d.id_producto
        WHERE ISNULL(i.peso_actual_kg, 0) != ISNULL(d.peso_actual_kg, 0)
           OR (d.peso_actual_kg IS NULL AND i.peso_actual_kg IS NOT NULL);
    END
END;
GO

-- 1. Ver estado actual de los productos
SELECT id_producto, nombre_producto, 
       ISNULL(peso_kg, 0) AS peso_kg,
       ISNULL(peso_actual_kg, 0) AS peso_actual_kg, 
       ISNULL(peso_anterior_kg, 0) AS peso_anterior_kg
FROM productos;

-- 2. Inicializar los pesos que están NULL
UPDATE productos
SET 
    peso_actual_kg = ISNULL(peso_kg, 0),
    peso_anterior_kg = ISNULL(peso_kg, 0),
    fecha_ultimo_peso = GETDATE(),
    fecha_peso_anterior = GETDATE()
WHERE peso_actual_kg IS NULL OR peso_anterior_kg IS NULL;


-- Trigger que use buscar_cp al insertar dirección
CREATE TRIGGER trg_direcciones_autocompletar
ON direcciones
INSTEAD OF INSERT
AS
BEGIN
    INSERT INTO direcciones (calle, numero_exterior, numero_interior, id_codigo_postal, referencias)
    SELECT 
        i.calle,
        i.numero_exterior,
        i.numero_interior,
        i.id_codigo_postal,
        i.referencias
    FROM inserted i
    WHERE EXISTS (SELECT 1 FROM codigos_postales WHERE idcp = i.id_codigo_postal);
    
    IF @@ROWCOUNT = 0
        RAISERROR('Código postal no válido', 16, 1);
END;

CREATE TRIGGER trg_AfterUpdatePedido
ON pedidos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO historial_pedido (id_pedido, id_estado_anterior, id_estado_nuevo, observaciones, id_usuario)
    SELECT 
        i.id_pedido,
        d.id_estado,
        i.id_estado,
        'Cambio de estado automático',
        1
    FROM inserted i
    INNER JOIN deleted d ON i.id_pedido = d.id_pedido
    WHERE i.id_estado != d.id_estado
END
GO

CREATE TRIGGER trg_AfterDeleteProducto
ON productos
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO auditoria (usuario, accion, tabla_afectada, registro_id, datos_anteriores, ip_address)
    SELECT 
        SYSTEM_USER,
        'DELETE',
        'productos',
        id_producto,
        'Nombre: ' + nombre_producto + ', SKU: ' + ISNULL(sku, 'N/A'),
        '127.0.0.1'
    FROM deleted
END
GO

CREATE TRIGGER trg_InsteadOfDeleteProducto
ON productos
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE p
    SET p.activo = 0
    FROM productos p
    INNER JOIN deleted d ON p.id_producto = d.id_producto
END
GO

CREATE TRIGGER trg_AfterInsertVenta
ON ventas
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET c.ultima_compra = i.fecha_venta,
        c.total_compras = c.total_compras + i.total
    FROM clientes c
    INNER JOIN inserted i ON c.id_cliente = i.id_cliente
END
GO
-- Trigger para recalcular total de venta automáticamente
CREATE OR ALTER TRIGGER trg_AfterInsertDetalleVenta_ActualizarTotal
ON detalle_venta
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE v
    SET 
        subtotal = ISNULL((
            SELECT SUM(subtotal_linea)
            FROM detalle_venta dv
            WHERE dv.id_venta = v.id_venta
        ), 0),
        iva = ISNULL((
            SELECT SUM(total_linea - subtotal_linea)
            FROM detalle_venta dv
            WHERE dv.id_venta = v.id_venta
        ), 0),
        total = ISNULL((
            SELECT SUM(total_linea)
            FROM detalle_venta dv
            WHERE dv.id_venta = v.id_venta
        ), 0) + ISNULL(v.flete, 0) + ISNULL(v.seguro_descarga, 0)
    FROM ventas v
    WHERE v.id_venta IN (
        SELECT DISTINCT id_venta FROM inserted
        UNION
        SELECT DISTINCT id_venta FROM deleted
    );
END


CREATE OR ALTER TRIGGER trg_BeforeInsertVenta
ON ventas
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN empleados e ON i.id_empleado = e.id_empleado
        WHERE e.activo = 0
    )
    BEGIN
        RAISERROR('El empleado no está activo para realizar ventas',16,1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END


-- ======================================================
-- CREAR TRIGGER CORREGIDO (incluye TODAS las columnas)
-- ======================================================
CREATE TRIGGER trg_BeforeUpdateProducto
ON productos
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que el stock no sea negativo
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.stock_actual < 0
    )
    BEGIN
        RAISERROR('El stock no puede ser negativo', 16, 1);
        RETURN;
    END
    
    -- Validar alerta de stock mínimo
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.stock_actual < i.stock_minimo
    )
    BEGIN
        INSERT INTO auditoria (usuario, accion, tabla_afectada, registro_id, 
                                datos_anteriores, datos_nuevos, observaciones)
        SELECT 
            SYSTEM_USER,
            'STOCK_BAJO',
            'productos',
            i.id_producto,
            'Stock anterior: ' + CAST(d.stock_actual AS VARCHAR),
            'Stock actual: ' + CAST(i.stock_actual AS VARCHAR),
            'ALERTA: El producto ha alcanzado stock mínimo'
        FROM inserted i
        INNER JOIN deleted d ON i.id_producto = d.id_producto
        WHERE i.stock_actual < i.stock_minimo
    END
    
    -- ✅ REALIZAR LA ACTUALIZACIÓN CON TODAS LAS COLUMNAS
    UPDATE p
    SET 
        p.nombre_producto = i.nombre_producto,
        p.descripcion = i.descripcion,
        p.id_categoria = i.id_categoria,
        p.sku = i.sku,
        p.stock_actual = i.stock_actual,
        p.stock_minimo = i.stock_minimo,
        p.stock_maximo = i.stock_maximo,
        p.precio_base = i.precio_base,
        p.unidad_medida = i.unidad_medida,
        -- ✅ AHORA SÍ actualiza TODAS las columnas de peso
        p.peso_kg = i.peso_kg,
        p.peso_actual_kg = i.peso_actual_kg,
        p.peso_anterior_kg = i.peso_anterior_kg,
        p.fecha_ultimo_peso = i.fecha_ultimo_peso,
        p.fecha_peso_anterior = i.fecha_peso_anterior,
        p.usuario_ultima_actualizacion = i.usuario_ultima_actualizacion,
        p.metodo_promedio = i.metodo_promedio,
        p.activo = i.activo
    FROM productos p
    INNER JOIN inserted i ON p.id_producto = i.id_producto;
END;
GO

-- ======================================================
-- INSTEAD OF DELETE en pedidos (solo cancela, no elimina)
-- ======================================================
CREATE OR ALTER TRIGGER trg_BeforeDeletePedido
ON pedidos
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- No permitir eliminar pedidos que ya están en producción o entregados
    IF EXISTS (
        SELECT 1
        FROM deleted d
        INNER JOIN estados_pedido e ON d.id_estado = e.id_estado
        WHERE e.nombre_estado IN ('EN_PRODUCCION', 'ENTREGADO')
    )
    BEGIN
        RAISERROR('No se pueden eliminar pedidos en producción o ya entregados. Use la cancelación.', 16, 1);
        RETURN;
    END
    
    -- En lugar de eliminar, cambiar estado a CANCELADO
    UPDATE p
    SET p.id_estado = (SELECT id_estado FROM estados_pedido WHERE nombre_estado = 'CANCELADO'),
        p.activo = 0
    FROM pedidos p
    INNER JOIN deleted d ON p.id_pedido = d.id_pedido;
    
    -- Registrar en historial
    INSERT INTO historial_pedido (id_pedido, id_estado_anterior, id_estado_nuevo, observaciones, id_usuario)
    SELECT 
        d.id_pedido,
        d.id_estado,
        (SELECT id_estado FROM estados_pedido WHERE nombre_estado = 'CANCELADO'),
        'Pedido cancelado por eliminación',
        1
    FROM deleted d;
END



-- Crear trigger corregido
CREATE OR ALTER TRIGGER trg_InsteadOfInsertDetalleVenta
ON detalle_venta
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar stock suficiente
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN productos p ON i.id_producto = p.id_producto
        WHERE p.stock_actual < i.cantidad
    )
    BEGIN
        RAISERROR('Stock insuficiente para realizar la venta', 16, 1);
        RETURN;
    END
    
    -- Insertar el detalle
    INSERT INTO detalle_venta (
        id_venta, id_producto, cantidad, precio_unitario,
        descuento_linea, iva_aplicado, ieps_aplicado,
        subtotal_linea, total_linea
    )
    SELECT 
        i.id_venta,
        i.id_producto,
        i.cantidad,
        i.precio_unitario,
        ISNULL(i.descuento_linea, 0),
        ISNULL(i.iva_aplicado, 16),
        ISNULL(i.ieps_aplicado, 0),
        i.subtotal_linea,
        i.total_linea
    FROM inserted i
    WHERE i.id_venta IS NOT NULL;
    
    -- ⚠️ IMPORTANTE: NO actualizar stock aquí porque ya lo hace el SP
    -- Esto evita la doble actualización
END
GO
GO
    
    
    -- Insertar el detalle si pasa todas las validaciones
    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, 
                                descuento_linea, iva_aplicado, ieps_aplicado, 
                                subtotal_linea, total_linea)
    SELECT id_venta, id_producto, cantidad, precio_unitario,
           descuento_linea, iva_aplicado, ieps_aplicado,
           subtotal_linea, total_linea
    FROM inserted;
END
GO
-- ======================================================
-- 11. PROCEDIMIENTOS ALMACENADOS
-- ======================================================
-- Ver el contenido del trigger

SELECT * FROM clientes
-- Debería dar: 5.6 × 23.81 × 1.12 = 149.38 (similar a tu 150.08, difiere por decimales)
CREATE OR ALTER PROCEDURE sp_RegistrarVenta
    @id_cliente INT,
    @id_empleado INT,
    @id_metodo_pago INT = 1,
    @detalle_json NVARCHAR(MAX),
    @observaciones NVARCHAR(500) = NULL,
    @id_venta INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    DECLARE @subtotal DECIMAL(18,2) = 0;
    DECLARE @iva_total DECIMAL(18,2) = 0;
    DECLARE @total DECIMAL(18,2) = 0;
    DECLARE @folio VARCHAR(20);
    DECLARE @anio INT = YEAR(GETDATE());
    DECLARE @id_tipo_cliente INT;
    DECLARE @ultimo_numero INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener tipo de cliente
        SELECT @id_tipo_cliente = id_tipo_cliente 
        FROM clientes 
        WHERE id_cliente = @id_cliente;
        
        IF @id_tipo_cliente IS NULL
        BEGIN
            SET @id_venta = -1;
            SELECT -1 AS id_venta, 'Cliente no encontrado' AS error;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Generar folio
        IF NOT EXISTS (SELECT 1 FROM folios WHERE tabla_nombre = 'VENTAS' AND anio = @anio)
        BEGIN
            INSERT INTO folios (tabla_nombre, ultimo_numero, prefijo, anio)
            VALUES ('VENTAS', 0, 'VTA', @anio);
        END
        
        UPDATE folios 
        SET ultimo_numero = ultimo_numero + 1 
        WHERE tabla_nombre = 'VENTAS' AND anio = @anio;
        
        SELECT @ultimo_numero = ultimo_numero 
        FROM folios 
        WHERE tabla_nombre = 'VENTAS' AND anio = @anio;
        
        SET @folio = 'VTA' + RIGHT('0000' + CAST(@ultimo_numero AS VARCHAR), 4);
        
        -- Insertar venta (sin flete ni seguro_descarga)
        INSERT INTO ventas (
            folio, id_cliente, id_empleado, id_metodo_pago,
            observaciones, subtotal, iva, total, fecha_venta
        )
        VALUES (
            @folio, @id_cliente, @id_empleado, @id_metodo_pago,
            @observaciones, 0, 0, 0, GETDATE()
        );
        
        SET @id_venta = SCOPE_IDENTITY();
        
        IF @id_venta IS NULL OR @id_venta = 0
        BEGIN
            SET @id_venta = -1;
            SELECT -1 AS id_venta, 'No se pudo crear la venta' AS error;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Tabla temporal para detalles
        CREATE TABLE #temp_detalle (
            id_producto INT,
            cantidad INT,
            descuento_linea DECIMAL(18,2),
            precio_unitario DECIMAL(18,2),
            subtotal_linea DECIMAL(18,2),
            total_linea DECIMAL(18,2)
        );
        
        -- Insertar con el nuevo cálculo (usando CalcularPrecioProducto)
        INSERT INTO #temp_detalle (id_producto, cantidad, descuento_linea, precio_unitario, subtotal_linea, total_linea)
        SELECT 
            id_producto,
            cantidad,
            ISNULL(descuento_linea, 0),
            dbo.CalcularPrecioProducto(id_producto, @id_tipo_cliente, cantidad),
            cantidad * dbo.CalcularPrecioProducto(id_producto, @id_tipo_cliente, cantidad),
            cantidad * dbo.CalcularPrecioProducto(id_producto, @id_tipo_cliente, cantidad)
        FROM OPENJSON(@detalle_json) 
        WITH (
            id_producto INT '$.id_producto',
            cantidad INT '$.cantidad',
            descuento_linea DECIMAL(18,2) '$.descuento_linea'
        );
        
        IF NOT EXISTS (SELECT 1 FROM #temp_detalle)
        BEGIN
            SET @id_venta = -1;
            SELECT -1 AS id_venta, 'No hay productos en la venta' AS error;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Insertar en detalle_venta
        INSERT INTO detalle_venta (
            id_venta, id_producto, cantidad, precio_unitario,
            descuento_linea, iva_aplicado, subtotal_linea, total_linea
        )
        SELECT 
            @id_venta,
            id_producto,
            cantidad,
            precio_unitario,
            descuento_linea,
            16,
            subtotal_linea,
            total_linea
        FROM #temp_detalle;
        
        -- Actualizar stock
        UPDATE p
        SET p.stock_actual = p.stock_actual - t.cantidad
        FROM productos p
        INNER JOIN #temp_detalle t ON p.id_producto = t.id_producto;
        
        -- Calcular totales
        SELECT 
            @subtotal = ISNULL(SUM(subtotal_linea), 0),
            @total = ISNULL(SUM(total_linea), 0)
        FROM #temp_detalle;
        
        -- El IVA es 16% del subtotal
        SET @iva_total = @subtotal * 0.16;
        
        -- Actualizar venta
        UPDATE ventas 
        SET 
            subtotal = @subtotal,
            iva = @iva_total,
            total = @total
        WHERE id_venta = @id_venta;
        
        -- Actualizar cliente
        UPDATE clientes
        SET 
            ultima_compra = GETDATE(),
            total_compras = ISNULL(total_compras, 0) + @total
        WHERE id_cliente = @id_cliente;
        
        DROP TABLE #temp_detalle;
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT @id_venta AS id_venta, @folio AS folio, @total AS total;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        IF OBJECT_ID('tempdb..#temp_detalle') IS NOT NULL
            DROP TABLE #temp_detalle;
        
        DECLARE @error_message NVARCHAR(4000) = ERROR_MESSAGE();
        SET @id_venta = -1;
        
        SELECT -1 AS id_venta, @error_message AS error;
    END CATCH
END;
GO

SELECT * FROM ventas
SELECT * FROM personas
SELECT 
GO
GO
GO
GO
GO
GO
CREATE OR ALTER PROCEDURE sp_ActualizarPesoProducto
    @id_producto INT,
    @nuevo_peso_kg DECIMAL(10,2),
    @id_usuario INT,
    @lote VARCHAR(50) = NULL,
    @proveedor VARCHAR(100) = NULL,
    @observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @peso_actual_actual DECIMAL(10,2);
        DECLARE @peso_anterior_actual DECIMAL(10,2);
        DECLARE @nuevo_promedio DECIMAL(10,2);
        
        -- Obtener valores actuales
        SELECT 
            @peso_actual_actual = ISNULL(peso_actual_kg, 0),
            @peso_anterior_actual = ISNULL(peso_anterior_kg, 0)
        FROM productos
        WHERE id_producto = @id_producto;
        
        -- Si no hay peso actual, usar el peso_kg como respaldo
        IF @peso_actual_actual = 0
        BEGIN
            SELECT @peso_actual_actual = ISNULL(peso_kg, 0)
            FROM productos
            WHERE id_producto = @id_producto;
        END
        
        -- Calcular nuevo promedio
        IF @peso_actual_actual = 0
            SET @nuevo_promedio = @nuevo_peso_kg;
        ELSE
            SET @nuevo_promedio = (@peso_actual_actual + @nuevo_peso_kg) / 2;
        
        -- ACTUALIZAR producto (el orden es IMPORTANTE)
        UPDATE productos
        SET 
            -- El peso actual se mueve a anterior
            peso_anterior_kg = @peso_actual_actual,
            -- El nuevo peso se guarda como actual
            peso_actual_kg = @nuevo_peso_kg,
            -- El promedio se guarda en peso_kg
            peso_kg = @nuevo_promedio,
            -- Fechas
            fecha_peso_anterior = ISNULL(fecha_ultimo_peso, GETDATE()),
            fecha_ultimo_peso = GETDATE(),
            usuario_ultima_actualizacion = @id_usuario
        WHERE id_producto = @id_producto;
        
        -- Registrar en historial
        INSERT INTO historial_pesos (
            id_producto, 
            peso_anterior, 
            peso_nuevo, 
            id_usuario,
            lote,
            proveedor,
            observaciones
        )
        VALUES (
            @id_producto,
            @peso_actual_actual,
            @nuevo_peso_kg,
            @id_usuario,
            @lote,
            @proveedor,
            @observaciones
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar producto actualizado
        SELECT 
            id_producto,
            ISNULL(peso_anterior_kg, 0) AS peso_anterior_kg,
            ISNULL(peso_actual_kg, 0) AS peso_actual_kg,
            ISNULL(peso_kg, 0) AS peso_kg,
            'Peso actualizado exitosamente' AS mensaje
        FROM productos
        WHERE id_producto = @id_producto;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS id_producto, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;

CREATE TABLE venta_pago (
    id_venta_pago INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    
    referencia VARCHAR(100) NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago)
);

CREATE PROCEDURE sp_RegistrarDevolucion
    @id_venta INT,
    @id_empleado INT,
    @motivo VARCHAR(500),
    @tipo_devolucion VARCHAR(20),
    @detalles_devolucion TVP_DetalleDevolucion READONLY,
    @id_devolucion INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @monto_reembolsado DECIMAL(18,2) = 0
    DECLARE @id_cliente INT
    DECLARE @folio VARCHAR(20)
    DECLARE @anio INT = YEAR(GETDATE())
    DECLARE @error_msg VARCHAR(500)
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        SELECT @id_cliente = id_cliente FROM ventas WHERE id_venta = @id_venta
        
        SELECT @monto_reembolsado = ISNULL(SUM(dv.total_linea * dd.cantidad / dv.cantidad), 0)
        FROM @detalles_devolucion dd
        INNER JOIN detalle_venta dv ON dd.id_detalle_venta = dv.id_detalle_venta
        
        IF @monto_reembolsado = 0
        BEGIN
            RAISERROR('No se puede registrar devolución con monto cero', 16, 1)
            ROLLBACK TRANSACTION
            RETURN
        END
        
        UPDATE folios SET ultimo_numero = ultimo_numero + 1 
        WHERE tabla_nombre = 'DEVOLUCIONES' AND anio = @anio
        
        IF @@ROWCOUNT = 0
        BEGIN
            INSERT INTO folios (tabla_nombre, ultimo_numero, prefijo, anio)
            VALUES ('DEVOLUCIONES', 1, 'DEV', @anio)
        END
        
        SELECT @folio = prefijo + RIGHT('0000' + CAST(ultimo_numero AS VARCHAR), 5)
        FROM folios WHERE tabla_nombre = 'DEVOLUCIONES' AND anio = @anio
        
        INSERT INTO devoluciones (folio, id_venta, id_cliente, tipo_devolucion, monto_reembolsado, motivo, autorizada_por)
        VALUES (@folio, @id_venta, @id_cliente, @tipo_devolucion, @monto_reembolsado, @motivo, @id_empleado)
        
        SET @id_devolucion = SCOPE_IDENTITY()
        
        INSERT INTO detalle_devolucion (id_devolucion, id_detalle_venta, cantidad, motivo_detalle)
        SELECT @id_devolucion, id_detalle_venta, cantidad, @motivo
        FROM @detalles_devolucion
        
        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION
        
        SET @error_msg = ERROR_MESSAGE()
        SET @id_devolucion = -1
        RAISERROR('Error al registrar devolución: %s', 16, 1, @error_msg)
    END CATCH
END
GO

CREATE PROCEDURE sp_CancelarVenta
    @id_venta INT,
    @motivo_cancelacion VARCHAR(255),
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        IF EXISTS (SELECT 1 FROM ventas WHERE id_venta = @id_venta AND cancelada = 1)
        BEGIN
            RAISERROR('La venta ya está cancelada', 16, 1)
            ROLLBACK
            RETURN
        END
        
        UPDATE p
        SET p.stock_actual = p.stock_actual + dv.cantidad
        FROM productos p
        INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
        WHERE dv.id_venta = @id_venta
        
        INSERT INTO movimientos_inventario (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, referencia_tabla, referencia_id, observaciones, id_usuario)
        SELECT 
            dv.id_producto,
            (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre_movimiento = 'DEVOLUCIÓN'),
            dv.cantidad,
            p.stock_actual - dv.cantidad,
            p.stock_actual,
            'CANCELACION_VENTA',
            @id_venta,
            @motivo_cancelacion,
            @id_usuario
        FROM detalle_venta dv
        INNER JOIN productos p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = @id_venta
        
        UPDATE ventas
        SET cancelada = 1,
            fecha_cancelacion = GETDATE(),
            motivo_cancelacion = @motivo_cancelacion
        WHERE id_venta = @id_venta
        
        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        THROW
    END CATCH
END

CREATE PROCEDURE sp_CrearPedido
    @id_cliente INT,
    @id_empleado INT,
    @fecha_entrega_estimada DATE,
    @detalles TVP_DetallePedido READONLY,
    @id_pedido INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @subtotal DECIMAL(18,2) = 0
    DECLARE @folio VARCHAR(20)
    DECLARE @anio INT = YEAR(GETDATE())
    DECLARE @id_estado_inicial INT = 1  -- 'COTIZACIÓN'
    DECLARE @error_msg VARCHAR(500)
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        -- Calcular subtotal
        SELECT @subtotal = ISNULL(SUM(cantidad * precio_unitario), 0)
        FROM @detalles
        
        IF @subtotal = 0 OR (SELECT COUNT(*) FROM @detalles) = 0
        BEGIN
            RAISERROR('El pedido debe tener al menos un producto', 16, 1)
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Generar folio
        UPDATE folios SET ultimo_numero = ultimo_numero + 1 
        WHERE tabla_nombre = 'PEDIDOS' AND anio = @anio
        
        IF @@ROWCOUNT = 0
        BEGIN
            INSERT INTO folios (tabla_nombre, ultimo_numero, prefijo, anio)
            VALUES ('PEDIDOS', 1, 'PED', @anio)
        END
        
        SELECT @folio = prefijo + RIGHT('0000' + CAST(ultimo_numero AS VARCHAR), 5)
        FROM folios WHERE tabla_nombre = 'PEDIDOS' AND anio = @anio
        
        -- Insertar pedido
        INSERT INTO pedidos (folio, id_cliente, id_empleado, fecha_entrega_estimada, id_estado, subtotal, total)
        VALUES (@folio, @id_cliente, @id_empleado, @fecha_entrega_estimada, @id_estado_inicial, @subtotal, @subtotal)
        
        SET @id_pedido = SCOPE_IDENTITY()
        
        -- Insertar detalle
        INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal_linea)
        SELECT @id_pedido, id_producto, cantidad, precio_unitario, (cantidad * precio_unitario)
        FROM @detalles
        
        COMMIT TRANSACTION
        
        SELECT 'Pedido creado exitosamente' AS Mensaje, @folio AS Folio
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION
        
        SET @error_msg = ERROR_MESSAGE()
        SET @id_pedido = -1
        
        RAISERROR('Error al crear pedido: %s', 16, 1, @error_msg)
    END CATCH
END
GO

CREATE PROCEDURE sp_CambiarEstadoPedido
    @id_pedido INT,
    @nuevo_estado INT,
    @observaciones VARCHAR(500) = NULL,
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @estado_anterior INT
    DECLARE @error_msg VARCHAR(500)
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        SELECT @estado_anterior = id_estado FROM pedidos WHERE id_pedido = @id_pedido
        
        IF @estado_anterior IS NULL
        BEGIN
            RAISERROR('Pedido no encontrado', 16, 1)
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Si pasa a "EN_PRODUCCIÓN" (3), reservar stock
        IF @nuevo_estado = 3 AND @estado_anterior != 3
        BEGIN
            UPDATE p
            SET p.stock_actual = p.stock_actual - dp.cantidad
            FROM productos p
            INNER JOIN detalle_pedido dp ON p.id_producto = dp.id_producto
            WHERE dp.id_pedido = @id_pedido
            
            IF EXISTS (SELECT 1 FROM productos WHERE stock_actual < 0)
            BEGIN
                RAISERROR('Stock insuficiente para reservar el pedido', 16, 1)
                ROLLBACK TRANSACTION
                RETURN
            END
        END
        
        -- Si pasa a ENTREGADO(5) o CANCELADO(6) y estaba reservado, liberar stock
        IF (@nuevo_estado IN (5,6)) AND @estado_anterior = 3
        BEGIN
            UPDATE p
            SET p.stock_actual = p.stock_actual + dp.cantidad
            FROM productos p
            INNER JOIN detalle_pedido dp ON p.id_producto = dp.id_producto
            WHERE dp.id_pedido = @id_pedido
        END
        
        UPDATE pedidos 
        SET id_estado = @nuevo_estado
        WHERE id_pedido = @id_pedido
        
        IF @nuevo_estado = 5
        BEGIN
            UPDATE pedidos 
            SET fecha_entrega_real = GETDATE()
            WHERE id_pedido = @id_pedido
        END
        
        INSERT INTO historial_pedido (id_pedido, id_estado_anterior, id_estado_nuevo, observaciones, id_usuario)
        VALUES (@id_pedido, @estado_anterior, @nuevo_estado, @observaciones, @id_usuario)
        
        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION
        
        SET @error_msg = ERROR_MESSAGE()
        RAISERROR('Error al cambiar estado del pedido: %s', 16, 1, @error_msg)
    END CATCH
END
GO

CREATE PROCEDURE sp_RegistrarNuevaTanda
    @id_producto INT,
    @nuevo_peso_kg DECIMAL(10,2),
    @cantidad_nueva_tanda INT,
    @id_usuario INT,
    @lote VARCHAR(50) = NULL,
    @proveedor VARCHAR(100) = NULL,
    @observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @peso_actual_actual DECIMAL(10,2);
        DECLARE @nuevo_promedio DECIMAL(10,2);
        DECLARE @stock_actual_actual INT;
        DECLARE @nuevo_stock INT;
        
        -- Obtener valores actuales
        SELECT 
            @peso_actual_actual = ISNULL(peso_actual_kg, 0),
            @stock_actual_actual = ISNULL(stock_actual, 0)
        FROM productos
        WHERE id_producto = @id_producto;
        
        -- Si no hay peso actual, usar peso_kg
        IF @peso_actual_actual = 0
        BEGIN
            SELECT @peso_actual_actual = ISNULL(peso_kg, 0)
            FROM productos
            WHERE id_producto = @id_producto;
        END
        
        -- Calcular nuevo promedio
        IF @peso_actual_actual = 0
            SET @nuevo_promedio = @nuevo_peso_kg;
        ELSE
            SET @nuevo_promedio = (@peso_actual_actual + @nuevo_peso_kg) / 2;
        
        -- Calcular nuevo stock
        SET @nuevo_stock = @stock_actual_actual + @cantidad_nueva_tanda;
        
        -- ACTUALIZAR producto
        UPDATE productos
        SET 
            peso_anterior_kg = @peso_actual_actual,
            peso_actual_kg = @nuevo_peso_kg,
            peso_kg = @nuevo_promedio,
            stock_actual = @nuevo_stock,
            fecha_peso_anterior = ISNULL(fecha_ultimo_peso, GETDATE()),
            fecha_ultimo_peso = GETDATE(),
            usuario_ultima_actualizacion = @id_usuario
        WHERE id_producto = @id_producto;
        
        -- Registrar en historial de pesos
        INSERT INTO historial_pesos (
            id_producto, peso_anterior, peso_nuevo, id_usuario, lote, proveedor, observaciones
        )
        VALUES (
            @id_producto, @peso_actual_actual, @nuevo_peso_kg, @id_usuario, @lote, @proveedor, 
            @observaciones + ' | Cantidad: ' + CAST(@cantidad_nueva_tanda AS VARCHAR)
        );
        
        -- Registrar movimiento de inventario
        INSERT INTO movimientos_inventario (
            id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, 
            referencia_tabla, observaciones, id_usuario
        )
        SELECT 
            @id_producto, id_tipo_movimiento, @cantidad_nueva_tanda,
            @stock_actual_actual, @nuevo_stock, 'NUEVA_TANDA',
            @observaciones, @id_usuario
        FROM tipos_movimiento 
        WHERE nombre_movimiento = 'COMPRA';
        
        COMMIT TRANSACTION;
        
        SELECT 
            id_producto,
            ISNULL(peso_anterior_kg, 0) AS peso_anterior_kg,
            ISNULL(peso_actual_kg, 0) AS peso_actual_kg,
            ISNULL(peso_kg, 0) AS peso_kg,
            stock_actual,
            'Nueva tanda registrada exitosamente' AS mensaje
        FROM productos
        WHERE id_producto = @id_producto;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS id_producto, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;
GO


CREATE PROCEDURE sp_RegistrarEntradaInventario
    @id_producto INT,
    @cantidad INT,
    @observaciones VARCHAR(500),
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @stock_antes INT
    DECLARE @error_msg VARCHAR(500)
    
    IF @cantidad <= 0
    BEGIN
        RAISERROR('La cantidad debe ser mayor a cero', 16, 1)
        RETURN
    END
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        SELECT @stock_antes = stock_actual FROM productos WHERE id_producto = @id_producto
        
        IF @stock_antes IS NULL
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1)
            ROLLBACK TRANSACTION
            RETURN
        END
        
        UPDATE productos 
        SET stock_actual = stock_actual + @cantidad
        WHERE id_producto = @id_producto
        
        INSERT INTO movimientos_inventario (id_producto, id_tipo_movimiento, cantidad, stock_antes, stock_despues, referencia_tabla, observaciones, id_usuario)
        SELECT @id_producto, id_tipo_movimiento, @cantidad, @stock_antes, @stock_antes + @cantidad, 'COMPRA', @observaciones, @id_usuario
        FROM tipos_movimiento WHERE nombre_movimiento = 'COMPRA'
        
        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION
        
        SET @error_msg = ERROR_MESSAGE()
        RAISERROR('Error al registrar entrada de inventario: %s', 16, 1, @error_msg)
    END CATCH
END
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('usuarios') AND name = 'password')
BEGIN
    ALTER TABLE usuarios ADD password VARCHAR(100) NULL;
END
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'estados')
BEGIN
    CREATE TABLE estados (
        idestado SMALLINT PRIMARY KEY,
        estado VARCHAR(150) NOT NULL
    );
END
SELECT * FROM clientes;
-- ======================================================
-- PROCEDIMIENTO: sp_ListarVentas
-- DESCRIPCIÓN: Lista ventas con filtros y paginación
-- ======================================================
CREATE OR ALTER PROCEDURE sp_ListarVentas
    @pagina INT = 1,
    @limite INT = 20,
    @termino NVARCHAR(100) = NULL,
    @id_cliente INT = NULL,
    @id_empleado INT = NULL,
    @id_metodo_pago INT = NULL,
    @fecha_desde DATE = NULL,
    @fecha_hasta DATE = NULL,
    @cancelada BIT = NULL,
    @orden_campo NVARCHAR(50) = 'fecha_venta',
    @orden_direccion NVARCHAR(4) = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@pagina - 1) * @limite;
    
    -- Consulta principal
    SELECT 
        v.id_venta,
        v.folio,
        v.id_cliente,
        CONCAT(pc.nombre, ' ', pc.apellido_paterno, ' ', ISNULL(pc.apellido_materno, '')) AS cliente_nombre,
        tc.nombre_tipo AS cliente_tipo,
        v.id_empleado,
        CONCAT(pe.nombre, ' ', pe.apellido_paterno, ' ', ISNULL(pe.apellido_materno, '')) AS empleado_nombre,
        pu.nombre_puesto AS empleado_puesto,
        v.id_metodo_pago,
        mp.nombre_metodo,
        v.fecha_venta,
        FORMAT(v.fecha_venta, 'dd/MM/yyyy HH:mm') AS fecha_venta_formato,
        v.subtotal,
        v.descuento_total,
        v.iva,
        v.ieps,
        v.total,
        v.flete,
        v.seguro_descarga,
        v.observaciones,
        v.cancelada,
        v.fecha_cancelacion,
        v.motivo_cancelacion,
        -- Contar productos por venta
        (SELECT COUNT(*) FROM detalle_venta WHERE id_venta = v.id_venta) AS total_productos,
        (SELECT SUM(cantidad) FROM detalle_venta WHERE id_venta = v.id_venta) AS total_piezas
    INTO #temp_ventas
    FROM ventas v
    INNER JOIN clientes c ON v.id_cliente = c.id_cliente
    INNER JOIN personas pc ON c.id_persona = pc.id_persona
    INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
    INNER JOIN empleados e ON v.id_empleado = e.id_empleado
    INNER JOIN personas pe ON e.id_persona = pe.id_persona
    INNER JOIN puestos pu ON e.id_puesto = pu.id_puesto
    INNER JOIN metodos_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
    WHERE 1=1
        AND (@termino IS NULL OR 
            v.folio LIKE '%' + @termino + '%' OR 
            pc.nombre LIKE '%' + @termino + '%' OR 
            pc.apellido_paterno LIKE '%' + @termino + '%')
        AND (@id_cliente IS NULL OR v.id_cliente = @id_cliente)
        AND (@id_empleado IS NULL OR v.id_empleado = @id_empleado)
        AND (@id_metodo_pago IS NULL OR v.id_metodo_pago = @id_metodo_pago)
        AND (@fecha_desde IS NULL OR CAST(v.fecha_venta AS DATE) >= @fecha_desde)
        AND (@fecha_hasta IS NULL OR CAST(v.fecha_venta AS DATE) <= @fecha_hasta)
        AND (@cancelada IS NULL OR v.cancelada = @cancelada);
    
    -- Obtener total de registros
    DECLARE @total_registros INT = (SELECT COUNT(*) FROM #temp_ventas);
    DECLARE @total_paginas INT = CEILING(CAST(@total_registros AS FLOAT) / @limite);
    
    -- Ordenamiento dinámico
    DECLARE @sql NVARCHAR(MAX) = '
        SELECT 
            *,
            @total_registros AS total_registros,
            @total_paginas AS total_paginas
        FROM #temp_ventas
        ORDER BY ' + QUOTENAME(@orden_campo) + ' ' + @orden_direccion + '
        OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY';
    
    -- Ejecutar consulta final
    EXEC sp_executesql @sql, 
        N'@offset INT, @limite INT, @total_registros INT, @total_paginas INT',
        @offset, @limite, @total_registros, @total_paginas;
    
    DROP TABLE #temp_ventas;
END;
GO

-- ======================================================
-- PROCEDIMIENTO: sp_ObtenerDetalleVenta
-- DESCRIPCIÓN: Obtiene el detalle completo de una venta
SELECT 
    name,
    type_desc,
    create_date,
    modify_date
FROM sys.procedures
WHERE name IN ('sp_ListarVentas', 'sp_ObtenerDetalleVenta', 'sp_EstadisticasDashboard', 'sp_RegistrarVenta', 'sp_CancelarVenta');

-- ======================================================
CREATE OR ALTER PROCEDURE sp_ObtenerDetalleVenta
    @id_venta INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Información de la venta
    SELECT 
        v.id_venta,
        v.folio,
        v.id_cliente,
        CONCAT(pc.nombre, ' ', pc.apellido_paterno, ' ', ISNULL(pc.apellido_materno, '')) AS cliente_nombre,
        pc.telefono AS cliente_telefono,
        pc.email AS cliente_email,
        tc.nombre_tipo AS cliente_tipo,
        v.id_empleado,
        CONCAT(pe.nombre, ' ', pe.apellido_paterno, ' ', ISNULL(pe.apellido_materno, '')) AS empleado_nombre,
        pu.nombre_puesto AS empleado_puesto,
        v.id_metodo_pago,
        mp.nombre_metodo,
        v.fecha_venta,
        FORMAT(v.fecha_venta, 'dd/MM/yyyy HH:mm') AS fecha_venta_formato,
        v.subtotal,
        v.descuento_total,
        v.iva,
        v.ieps,
        v.total,
        v.flete,
        v.seguro_descarga,
        v.observaciones,
        v.cancelada,
        v.fecha_cancelacion,
        v.motivo_cancelacion
    FROM ventas v
    INNER JOIN clientes c ON v.id_cliente = c.id_cliente
    INNER JOIN personas pc ON c.id_persona = pc.id_persona
    INNER JOIN tipos_cliente tc ON c.id_tipo_cliente = tc.id_tipo_cliente
    INNER JOIN empleados e ON v.id_empleado = e.id_empleado
    INNER JOIN personas pe ON e.id_persona = pe.id_persona
    INNER JOIN puestos pu ON e.id_puesto = pu.id_puesto
    INNER JOIN metodos_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
    WHERE v.id_venta = @id_venta;
    
    -- 2. Detalle de productos
    SELECT 
        dv.id_detalle_venta,
        dv.id_producto,
        p.nombre_producto,
        p.sku,
        dv.cantidad,
        dv.precio_unitario,
        dv.descuento_linea,
        dv.iva_aplicado,
        dv.ieps_aplicado,
        dv.subtotal_linea,
        dv.total_linea
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id_producto
    WHERE dv.id_venta = @id_venta
    ORDER BY dv.id_detalle_venta;
    
    -- 3. Pagos adicionales
    SELECT 
        vp.id_venta_pago,
        vp.id_metodo_pago,
        mp.nombre_metodo,
        vp.monto,
        vp.referencia,
        vp.fecha_pago
    FROM venta_pago vp
    INNER JOIN metodos_pago mp ON vp.id_metodo_pago = mp.id_metodo_pago
    WHERE vp.id_venta = @id_venta;
    
    -- 4. Datos de transferencia
    SELECT 
        t.id_transferencia,
        t.banco_emisor,
        t.banco_receptor,
        t.cuenta_origen,
        t.cuenta_destino,
        t.referencia,
        t.monto,
        t.fecha_transferencia,
        t.comprobante_url
    FROM transferencias t
    WHERE t.id_venta = @id_venta;
END;
ALTER TABLE venta_pago ADD fecha_pago DATE DEFAULT GETDATE();

SELECT * FROM venta_pago
-- ===================================================
-- iNDICES
-- ==================================================
CREATE INDEX lx_historial_pesos
ON historial_pesos_prodcutps(id_productos, fehca_cambio)
-- ======================================================
-- 12. DATOS DE CATÁLOGO
-- ======================================================

INSERT INTO tipos_movimiento (nombre_movimiento, signo, afecta_stock) VALUES
('VENTA', -1, 1),
('DEVOLUCIÓN', 1, 1),
('COMPRA', 1, 1),
('AJUSTE_INVENTARIO', 1, 1),
('PEDIDO_RESERVADO', -1, 0);

INSERT INTO roles (nombre_rol, descripcion) VALUES
('ADMIN', 'Administrador'),
('VENDEDOR', 'Vendedor'),
('ALMACEN', 'Encargado'),
('GERENTE', 'Gerente');

INSERT INTO tipos_cliente (nombre_tipo, descuento_base, requiere_volumen_minimo, volumen_minimo) VALUES
('PUBLICO', 0, 0, 0),
('HERRERO', 5, 0, 0),
('MAYOREO_TIPO1', 10, 1, 50),
('MAYOREO_TIPO2', 15, 1, 100);
('HERRERO1', )
INSERT INTO listas_precios (nombre_lista, descripcion) VALUES
('LISTA_PUBLICO', 'Precios público'),
('LISTA_HERRERO', 'Precios herrero'),
('LISTA_MAYOREO1', 'Mayoreo tipo1'),
('LISTA_MAYOREO2', 'Mayoreo tipo2');
SELECT * FROM personas
INSERT INTO estados_pedido (nombre_estado, orden) VALUES
('COTIZACIÓN', 1),
('APROBADO', 2),
('EN_PRODUCCIÓN', 3),
('ENVIADO', 4),
('ENTREGADO', 5),
('CANCELADO', 6);

INSERT INTO impuestos (nombre_impuesto, porcentaje, tipo_impuesto) VALUES
('IVA', 16, 'IVA'),
('IEPS_8', 8, 'IEPS'),
('IEPS_15', 15, 'IEPS'),
('IEPS_25', 25, 'IEPS'),
('IEPS_30', 30, 'IEPS'),
('IEPS_50', 50, 'IEPS');

INSERT INTO categorias (nombre_categoria) VALUES
('MONTEN'),
('PTR'),
('TUBO_CED30');

INSERT INTO productos (nombre_producto, sku, id_categoria, stock_actual, stock_minimo, precio_base) VALUES
('MONTEN 3x6 C-16', 'MTN-3X6-C16', 1, 500, 50, 850.00);
('MONTEN 4x6 C-16', 'MTN-4X6-C16', 1, 500, 50, 950.00),
('PTR 1 C13', 'PTR-1-C13', 2, 800, 80, 420.00),
('TUBO CED 30 2"', 'TUBO-C30-2', 3, 400, 40, 750.00);

INSERT INTO producto_impuesto (id_producto, id_impuesto) VALUES
(1,1),(2,1),(3,1),(4,1);

INSERT INTO precios_por_lista (id_producto, id_lista, cantidad_minima, cantidad_maxima, precio_unitario) VALUES
(1,1,1,NULL,850.00),
(1,2,1,NULL,807.50),
(1,3,50,99,765.00),
(1,4,100,NULL,722.50);

-- =========================================
-- PERSONAS
-- =========================================
INSERT INTO personas
(nombre, apellido_paterno, apellido_materno, email, telefono, celular, rfc, curp, fecha_nacimiento, id_direccion)
VALUES
(
    'Juan',
    'Pérez',
    'López',
    'juan.perez@gmail.com',
    '4431234567',
    '4439876543',
    'PELJ900101AB1',
    'PELJ900101HMCRPN01',
    '1990-01-01',
    1
)
(
    'María',
    'González',
    'Ruiz',
    'maria.gonzalez@gmail.com',
    '4432223344',
    '4435556677',
    'GORM920215CD2',
    'GORM920215MMCNZR08',
    '1992-02-15',
    2
),
(
    'Carlos',
    'Ramírez',
    'Torres',
    'carlos.ramirez@gmail.com',
    '4521112233',
    '4529998877',
    'RATC880530EF3',
    'RATC880530HMCRRR04',
    '1988-05-30',
    3
),
(
    'Lucía',
    'Fernández',
    'Morales',
    'lucia.fernandez@gmail.com',
    '7531239876',
    '7534567890',
    'FEML950720GH4',
    'FEML950720MMCRRC02',
    '1995-07-20',
    4
),
(
    'Diego',
    'Navarro',
    'Silva',
    'diego.navarro@gmail.com',
    '4438887766',
    '4431112233',
    'NASD970315IJ5',
    'NASD970315HMCRLV09',
    '1997-03-15',
    5
);

-- =========================================
-- ROLES
-- =========================================
INSERT INTO roles
(nombre_rol, descripcion)
VALUES
('Administrador', 'Acceso total al sistema'),
('Gerente', 'Gestión operativa y administrativa'),
('Vendedor', 'Atención a clientes y ventas'),
('Almacenista', 'Control de inventario');

-- =========================================
-- CLIENTES
-- =========================================
INSERT INTO clientes
(id_persona, id_tipo_cliente, ultima_compra, total_compras, factor_descuento_extra, credito_autorizado, limite_credito)
VALUES
(3002, 4, GETDATE(), 15000, 2, 1, 10000);
(6007, 1, GETDATE(), 3000, 4, 0, 0),
(5, 2, GETDATE(), 45000, 5, 1, 50000);
SELECT * FROM tipos_cliente
-- =========================================
-- PUESTOS
-- =========================================
INSERT INTO puestos
(nombre_puesto, salario_base, descripcion)
VALUES
('Administrador General', 25000, 'Gestión completa del negocio'),
('Gerente de Ventas', 18000, 'Supervisión de vendedores'),
('Vendedor Mostrador', 9000, 'Atención al cliente'),
('Encargado de Almacén', 10000, 'Control de inventario');

-- =========================================
-- EMPLEADOS
-- =========================================
SELECT * FROM empleados
INSERT INTO empleados
(id_persona, id_puesto, numero_empleado, fecha_contratacion, salario, comision_por_venta)
VALUES
(3004, 1, 'EMP001', '2022-01-15', 26000, 0);
(2, 2, 'EMP002', '2023-03-10', 18500, 2),
(3, 3, 'EMP003', '2024-06-01', 9500, 5),
(4, 4, 'EMP004', '2023-11-20', 10500, 0);
-- ======================================================
-- 13. ÍNDICES
-- ======================================================

CREATE INDEX IX_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IX_ventas_cliente ON ventas(id_cliente);
CREATE INDEX IX_detalle_venta_venta ON detalle_venta(id_venta);
CREATE INDEX IX_pedidos_estado ON pedidos(id_estado);
CREATE INDEX IX_productos_stock ON productos(stock_actual);
CREATE INDEX IX_codigos_postales_cp ON codigos_postales(cp);
CREATE INDEX IX_direcciones_cp ON direcciones(id_codigo_postal);
CREATE INDEX IX_personas_email ON personas(email) WHERE email IS NOT NULL;

INSERT INTO personas (nombre, apellido_paterno, apellido_materno, email, telefono, celular, rfc, curp, fecha_nacimiento, id_direccion, activo) VALUES
('Juan Carlos', 'González', 'Pérez', 'juanc.gonzalez@gmail.com', '4921234567', '4929876543', 'GOPJ850101HDF', 'GOPJ850101HDFZAC01', '1985-01-15', 1, 1),
('Miguel Ángel', 'Rodríguez', 'Martínez', 'miguel.rodriguez@hotmail.com', '4927654321', '4925551234', 'ROMR750505HDF', 'ROMR750505HDFZAC02', '1975-05-20', 2, 1);


INSERT INTO roles (nombre_rol, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Vendedor', 'Realiza ventas y atiende clientes'),
('Almacenista', 'Control de inventario y pedidos');

INSERT INTO usuarios (id_persona, username, password_hash, id_rol, activo) VALUES
(4, 'carlos.flores', 'admin123', 1, 1),      -- Administrador
(5, 'laura.martinez', 'ventas123', 2, 1);   -- Vendedor
select * from personas;
UPDATE usuarios SET password = 'admin123' WHERE username = 'admin';
UPDATE usuarios SET password = 'gerencia123' WHERE username = 'gerencia';
UPDATE usuarios SET password = 'ventas123' WHERE username = 'ventas01';
UPDATE usuarios SET password = 'almacen123' WHERE username = 'almacen01';



CREATE UNIQUE INDEX UX_personas_email
ON personas(email)
WHERE email IS NOT NULL;

CREATE UNIQUE INDEX UX_personas_rfc
ON personas(rfc)
WHERE rfc IS NOT NULL;

CREATE UNIQUE INDEX UX_personas_curp
ON personas(curp)
WHERE curp IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM personas WHERE email = 'admin@ferreteria.com')
BEGIN
    INSERT INTO personas (nombre, apellido_paterno, email, activo, fecha_creacion)
    VALUES ('Admin', 'Sistema', 'admin@ferreteria.com', 1, GETDATE());
END

SELECT 
    OBJECT_NAME(parent_object_id) AS table_name,
    name AS constraint_name,
    type_desc
FROM sys.objects 
WHERE type_desc LIKE '%CONSTRAINT' 
AND parent_object_id = OBJECT_ID('personas');
-- Eliminar constraints UNIQUE
UQ__personas__2CDDD19493AF2CA4
UQ__personas__C2B03494569D6DF3
UQ__personas__AB6E616492635490
DF__personas__activo__4B422AD5
]DF__personas__fecha___4C364F0E
ALTER TABLE personas DROP CONSTRAINT UQ__personas__2CDDD19493AF2CA4
ALTER TABLE personas DROP CONSTRAINT UQ__personas__C2B03494569D6DF3
ALTER TABLE personas DROP CONSTRAINT UQ__personas__AB6E616492635490

SELECT * FROM productos;
ALTER TABLE puestos ADD activo BIT ;
INSERT INTO puestos (nombre_puesto, salario_base, descripcion, activo) VALUES
('Cajero', 7000.00, 'Encargado de cobros', 1);

-- PRIMERO: Eliminar la vista defectuosa
DROP VIEW IF EXISTS vw_PreciosProductosPorCliente;
GO

-- SEGUNDO: Recrearla con el nombre correcto de la función
CREATE VIEW vw_PreciosProductosPorCliente AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    p.sku,
    p.peso_actual_kg AS peso_actual,
    p.peso_anterior_kg AS peso_anterior,
    dbo.CalcularPesoPromedio(p.id_producto, 'PROMEDIO') AS peso_promedio,
    dbo.CalcularPesoPromedio(p.id_producto, 'PONDERADO') AS peso_ponderado,
    p.precio_base AS costo_base,
    tc.id_tipo_cliente,
    tc.nombre_tipo,
    -- AHORA CON EL NOMBRE CORRECTO: CalcularPrecioConPeso
    dbo.CalcularPrecioConPeso(p.id_producto, tc.id_tipo_cliente, 1, 1, 'PROMEDIO') AS precio_promedio,
    dbo.CalcularPrecioConPeso(p.id_producto, tc.id_tipo_cliente, 1, 1, 'PONDERADO') AS precio_ponderado,
    dbo.CalcularPrecioConPeso(p.id_producto, tc.id_tipo_cliente, 1, 0, 'ULTIMO') AS precio_actual,
    dbo.CalcularPrecioConPeso(p.id_producto, tc.id_tipo_cliente, 25, 1, 'PONDERADO') AS precio_25_piezas,
    dbo.CalcularPrecioConPeso(p.id_producto, tc.id_tipo_cliente, 50, 1, 'PONDERADO') AS precio_50_piezas,
    dbo.CalcularPrecioConPeso(p.id_producto, tc.id_tipo_cliente, 100, 1, 'PONDERADO') AS precio_100_piezas
FROM productos p
CROSS JOIN tipos_cliente tc
WHERE p.activo = 1 AND tc.id_tipo_cliente <= 6;
GO


-- CORREGIR sp_ActualizarPesoProducto
CREATE PROCEDURE sp_ActualizarPesoProducto
    @id_producto INT,
    @nuevo_peso_kg DECIMAL(10,2),
    @id_usuario INT,
    @lote VARCHAR(50) = NULL,
    @proveedor VARCHAR(100) = NULL,
    @observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @peso_actual_actual DECIMAL(10,2);
        DECLARE @peso_anterior_actual DECIMAL(10,2);
        DECLARE @nuevo_promedio DECIMAL(10,2);
        
        -- Obtener valores actuales
        SELECT 
            @peso_actual_actual = ISNULL(peso_actual_kg, 0),
            @peso_anterior_actual = ISNULL(peso_anterior_kg, 0)
        FROM productos
        WHERE id_producto = @id_producto;
        
        -- Si no hay peso actual, usar el peso_kg como respaldo
        IF @peso_actual_actual = 0
        BEGIN
            SELECT @peso_actual_actual = ISNULL(peso_kg, 0)
            FROM productos
            WHERE id_producto = @id_producto;
        END
        
        -- Calcular nuevo promedio
        IF @peso_actual_actual = 0
            SET @nuevo_promedio = @nuevo_peso_kg;
        ELSE
            SET @nuevo_promedio = (@peso_actual_actual + @nuevo_peso_kg) / 2;
        
        -- ACTUALIZAR producto (el orden es IMPORTANTE)
        UPDATE productos
        SET 
            -- El peso actual se mueve a anterior
            peso_anterior_kg = @peso_actual_actual,
            -- El nuevo peso se guarda como actual
            peso_actual_kg = @nuevo_peso_kg,
            -- El promedio se guarda en peso_kg
            peso_kg = @nuevo_promedio,
            -- Fechas
            fecha_peso_anterior = ISNULL(fecha_ultimo_peso, GETDATE()),
            fecha_ultimo_peso = GETDATE(),
            usuario_ultima_actualizacion = @id_usuario
        WHERE id_producto = @id_producto;
        
        -- Registrar en historial
        INSERT INTO historial_pesos (
            id_producto, 
            peso_anterior, 
            peso_nuevo, 
            id_usuario,
            lote,
            proveedor,
            observaciones
        )
        VALUES (
            @id_producto,
            @peso_actual_actual,
            @nuevo_peso_kg,
            @id_usuario,
            @lote,
            @proveedor,
            @observaciones
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar producto actualizado
        SELECT 
            id_producto,
            ISNULL(peso_anterior_kg, 0) AS peso_anterior_kg,
            ISNULL(peso_actual_kg, 0) AS peso_actual_kg,
            ISNULL(peso_kg, 0) AS peso_kg,
            'Peso actualizado exitosamente' AS mensaje
        FROM productos
        WHERE id_producto = @id_producto;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS id_producto, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;


-- Corregir trigger que también usaba la tabla incorrecta
CREATE OR ALTER TRIGGER trg_RegistrarCambioPeso
ON productos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(peso_actual_kg)
    BEGIN
        INSERT INTO historial_pesos (  -- <-- Cambiado: antes era historial_pesos_productos
            id_producto,
            peso_anterior,
            peso_nuevo,
            id_usuario,
            observaciones
        )
        SELECT 
            i.id_producto,
            ISNULL(d.peso_actual_kg, 0) AS peso_anterior,
            ISNULL(i.peso_actual_kg, 0) AS peso_nuevo,
            ISNULL(i.usuario_ultima_actualizacion, 1) AS id_usuario,
            'Cambio automático por trigger' AS observaciones
        FROM inserted i
        INNER JOIN deleted d ON i.id_producto = d.id_producto
        WHERE ISNULL(i.peso_actual_kg, 0) != ISNULL(d.peso_actual_kg, 0);
    END
END;


SELECT * FROM productos
ALTER TABLE categorias ADD activo BIT DEFAULT 1;
UPDATE categorias SET activo = 1 WHERE activo IS NULL;


-- CORREGIR EL PROCEDIMIENTO sp_ActualizarPesoProducto
CREATE OR ALTER PROCEDURE sp_ActualizarPesoProducto
    @id_producto INT,
    @nuevo_peso_kg DECIMAL(10,2),
    @id_usuario INT = 1,
    @lote VARCHAR(50) = NULL,
    @proveedor VARCHAR(100) = NULL,
    @observaciones VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM productos WHERE id_producto = @id_producto)
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1);
            RETURN;
        END
        
        DECLARE @peso_actual_actual DECIMAL(10,2);
        DECLARE @fecha_actual DATETIME = GETDATE();
        
        -- Obtener peso actual
        SELECT @peso_actual_actual = ISNULL(peso_actual_kg, ISNULL(peso_kg, 0))
        FROM productos
        WHERE id_producto = @id_producto;
        
        -- Actualizar producto
        UPDATE productos
        SET 
            peso_anterior_kg = peso_actual_kg,
            peso_actual_kg = @nuevo_peso_kg,
            peso_kg = @nuevo_peso_kg,
            fecha_peso_anterior = fecha_ultimo_peso,
            fecha_ultimo_peso = @fecha_actual,
            usuario_ultima_actualizacion = @id_usuario
        WHERE id_producto = @id_producto;
        
        -- Registrar en historial (solo si la tabla existe)
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'historial_pesos')
        BEGIN
            INSERT INTO historial_pesos (
                id_producto, peso_anterior, peso_nuevo, id_usuario, 
                lote, proveedor, observaciones, fecha_cambio
            )
            VALUES (
                @id_producto, 
                @peso_actual_actual, 
                @nuevo_peso_kg, 
                @id_usuario, 
                @lote, 
                @proveedor, 
                @observaciones,
                @fecha_actual
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Retornar el producto actualizado
        SELECT 
            id_producto,
            nombre_producto,
            peso_anterior_kg,
            peso_actual_kg,
            'Peso actualizado exitosamente' AS mensaje
        FROM productos
        WHERE id_producto = @id_producto;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SELECT 
            ERROR_MESSAGE() AS error,
            ERROR_NUMBER() AS error_number;
        THROW;
    END CATCH
END;


-- Primero, eliminar si existe
DROP PROCEDURE IF EXISTS sp_ActualizarPesoProducto;
GO

-- Crear el procedimiento corregido

SELECT * FROM puestos

-- ======================================================
-- FUNCIÓN: CalcularPrecioConPeso
-- ======================================================
CREATE OR ALTER FUNCTION dbo.CalcularPrecioConPeso(
    @id_producto INT,
    @id_tipo_cliente INT,
    @cantidad INT = 1,
    @usar_peso_promedio BIT = 1,
    @tipo_promedio VARCHAR(20) = 'PROMEDIO'
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @precio_final DECIMAL(18,2);
    DECLARE @costo_base DECIMAL(18,2);
    DECLARE @peso_producto DECIMAL(10,2);
    DECLARE @costo_logistico DECIMAL(18,2);
    DECLARE @precio_base DECIMAL(18,2);
    DECLARE @factor_cliente DECIMAL(5,3);
    DECLARE @peso_actual DECIMAL(10,2);
    DECLARE @peso_anterior DECIMAL(10,2);
    
    -- Obtener costo base del producto
    SELECT @costo_base = precio_base
    FROM productos
    WHERE id_producto = @id_producto AND activo = 1;
    
    -- Obtener pesos
    SELECT 
        @peso_actual = ISNULL(peso_actual_kg, peso_kg),
        @peso_anterior = peso_anterior_kg
    FROM productos
    WHERE id_producto = @id_producto;
    
    -- Calcular peso promedio si es necesario
    IF @usar_peso_promedio = 1 AND @tipo_promedio = 'PROMEDIO' AND @peso_anterior IS NOT NULL
        SET @peso_producto = (@peso_actual + @peso_anterior) / 2;
    ELSE IF @usar_peso_promedio = 1 AND @tipo_promedio = 'PONDERADO' AND @peso_anterior IS NOT NULL
        SET @peso_producto = (@peso_actual * 0.7) + (@peso_anterior * 0.3);
    ELSE
        SET @peso_producto = @peso_actual;
    
    -- Si no hay peso válido, usar 1 como default
    IF @peso_producto IS NULL OR @peso_producto = 0
        SET @peso_producto = 1;
    
    -- Calcular costo logístico (flete + seguro + descarga) basado en peso
    SET @costo_logistico = (@peso_producto * 0.30) +  -- Flete
                          (@peso_producto * 0.10) +  -- Seguro
                          (@peso_producto * 0.12);   -- Descarga
    
    -- Costo base + logística
    SET @precio_base = @costo_base + @costo_logistico;
    
    -- Aplicar IVA (16%)
    SET @precio_base = @precio_base * 1.16;
    
    -- Aplicar factor según tipo de cliente
    SELECT @factor_cliente = CASE @id_tipo_cliente
        WHEN 1 THEN 1.13    -- PUBLICO
        WHEN 2 THEN 1.12    -- HERRERO 2
        WHEN 3 THEN 1.11    -- HERRERO 3
        WHEN 4 THEN 1.10    -- HERRERO 4
        WHEN 5 THEN 1.095   -- MAYOREO 1
        WHEN 6 THEN 1.09    -- MAYOREO 2
        ELSE 1.13
    END;
    
    -- Aplicar descuento por volumen
    IF @cantidad >= 100
        SET @factor_cliente = @factor_cliente * 0.95;
    ELSE IF @cantidad >= 50
        SET @factor_cliente = @factor_cliente * 0.97;
    ELSE IF @cantidad >= 25
        SET @factor_cliente = @factor_cliente * 0.98;
    
    SET @precio_final = @precio_base * @factor_cliente;
    
    RETURN ROUND(@precio_final, 2);
END;
GO

-- ======================================================
-- FUNCIÓN: CalcularPesoPromedio (si no existe)
-- ======================================================
SELECT u.id_usuario, u.id_persona, e.id_empleado
FROM usuarios u
LEFT JOIN empleados e ON u.id_persona = e.id_persona
WHERE u.username = 'mar';

CREATE OR ALTER FUNCTION dbo.CalcularPesoPromedio(
    @id_producto INT,
    @tipo_promedio VARCHAR(20) = 'PROMEDIO'
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @peso_final DECIMAL(10,2);
    DECLARE @peso_actual DECIMAL(10,2);
    DECLARE @peso_anterior DECIMAL(10,2);
    DECLARE @fecha_actual DATETIME;
    DECLARE @fecha_anterior DATETIME;
    
    SELECT 
        @peso_actual = peso_actual_kg,
        @peso_anterior = peso_anterior_kg,
        @fecha_actual = fecha_ultimo_peso,
        @fecha_anterior = fecha_peso_anterior
    FROM productos
    WHERE id_producto = @id_producto;
    
    IF @tipo_promedio = 'ULTIMO'
    BEGIN
        SET @peso_final = ISNULL(@peso_actual, 0);
    END
    ELSE IF @tipo_promedio = 'PROMEDIO_SIMPLE'
    BEGIN
        IF @peso_anterior IS NOT NULL
            SET @peso_final = (@peso_actual + @peso_anterior) / 2;
        ELSE
            SET @peso_final = @peso_actual;
    END
    ELSE IF @tipo_promedio = 'PONDERADO'
    BEGIN
        IF @peso_anterior IS NOT NULL AND @fecha_anterior IS NOT NULL
        BEGIN
            DECLARE @dias_diferencia INT;
            DECLARE @factor_actual DECIMAL(5,2);
            DECLARE @factor_anterior DECIMAL(5,2);
            
            SET @dias_diferencia = DATEDIFF(DAY, @fecha_anterior, @fecha_actual);
            
            IF @dias_diferencia <= 30
            BEGIN
                SET @factor_actual = 0.7;
                SET @factor_anterior = 0.3;
            END
            ELSE IF @dias_diferencia <= 90
            BEGIN
                SET @factor_actual = 0.6;
                SET @factor_anterior = 0.4;
            END
            ELSE
            BEGIN
                SET @factor_actual = 0.5;
                SET @factor_anterior = 0.5;
            END
            
            SET @peso_final = (@peso_actual * @factor_actual) + 
                             (@peso_anterior * @factor_anterior);
        END
        ELSE
            SET @peso_final = @peso_actual;
    END
    
    RETURN ROUND(ISNULL(@peso_final, 0), 2);
END;
GO



-- 1. Ver valores ANTES
SELECT * from ventas
-- 2. Ejecutar actualización
EXEC sp_ActualizarPesoProducto 
    @id_producto = 3,
    @nuevo_peso_kg = 15.0,
    @id_usuario = 10,
    @lote = 'TEST-CORREGIDO',
    @proveedor = 'Proveedor',
    @observaciones = 'Probando trigger corregido';
select * from productos
-- 3. Ver valores DESPUÉS (DEBERÍA FUNCIONAR)
SELECT id_producto, peso_anterior_kg, peso_actual_kg, peso_kg
FROM productos WHERE id_producto = 3;
    INSERT INTO tipos_movimiento (nombre_movimiento, signo, afecta_stock)
    VALUES ('AJUSTE', 1, 1);
    PRINT '✅ Tipo AJUSTE creado';

DELETE FROM tipos_movimiento
WHERE id_tipo_movimiento = 1006;