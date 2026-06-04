-- ============================================================
-- SEED: Tipos de dispositivo y periférico por defecto
-- Ejecutar si los selectores de tipo aparecen vacíos.
-- Es seguro re-ejecutar (no duplica filas).
-- ============================================================

INSERT INTO tipo_dispositivo (nombre, categoria, descripcion)
SELECT v.nombre, v.categoria, v.descripcion
FROM (VALUES
    ('Desktop',      'equipo', 'Computadora de escritorio'),
    ('Portátil',     'equipo', 'Computadora portátil / laptop'),
    ('Todo en uno',  'equipo', 'Computadora todo en uno (AIO)'),
    ('Servidor',     'equipo', 'Servidor'),
    ('Tablet',       'equipo', 'Tableta'),
    ('Workstation',  'equipo', 'Estación de trabajo'),
    ('Mouse',        'periferico', 'Dispositivo señalador'),
    ('Teclado',      'periferico', 'Dispositivo de entrada de texto'),
    ('Monitor',      'periferico', 'Pantalla de visualización'),
    ('Audífonos',    'periferico', 'Dispositivo de audio'),
    ('Cámara web',   'periferico', 'Cámara para videoconferencias'),
    ('Impresora',    'periferico', 'Dispositivo de impresión'),
    ('UPS',          'periferico', 'Sistema de alimentación ininterrumpida'),
    ('Otro',         'periferico', 'Otro dispositivo periférico')
) AS v(nombre, categoria, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM tipo_dispositivo td
    WHERE LOWER(td.nombre) = LOWER(v.nombre)
      AND td.categoria = v.categoria
);
