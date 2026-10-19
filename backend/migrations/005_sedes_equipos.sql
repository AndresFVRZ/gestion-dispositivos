-- Migración: vincular equipos al catálogo de sedes (equipos.sede_id)
-- Motor: MariaDB / MySQL (XAMPP). Ejecutar con:
--   mysql -u root --default-character-set=utf8mb4 lucoa < 005_sedes_equipos.sql
-- Es seguro re-ejecutar.
--
-- Los equipos solo guardaban la sede como texto libre (CACIQUE, CACQUE, CR 15, SL...)
-- y equipos.sede_id estaba vacío. El texto original se conserva en equipos.sede.

SET NAMES utf8mb4;

-- 1. Las sedes del catálogo estaban solo bajo SCI; los equipos que las usan son de EMTRA
INSERT INTO sedes (empresa_id, nombre)
SELECT e.id, s.nombre
FROM empresas e
JOIN (SELECT 'CACIQUE' AS nombre UNION ALL SELECT 'CRA 15'
      UNION ALL SELECT 'SANTA LUCIA' UNION ALL SELECT 'PATIOS') s
WHERE e.nombre = 'EMTRA'
  AND NOT EXISTS (SELECT 1 FROM sedes x WHERE x.empresa_id = e.id AND x.nombre = s.nombre);

-- 2. Texto libre → sede del catálogo de la misma empresa
UPDATE equipos eq
JOIN sedes s
  ON s.empresa_id = eq.empresa_id
 AND s.nombre = CASE
        WHEN UPPER(TRIM(eq.sede)) LIKE 'CAC%'                              THEN 'CACIQUE'
        WHEN REPLACE(UPPER(eq.sede), ' ', '') IN ('CRA15', 'CR15')         THEN 'CRA 15'
        WHEN UPPER(TRIM(eq.sede)) IN ('SL', 'SANTA LUCIA', 'SANTA LUCÍA')  THEN 'SANTA LUCIA'
        WHEN UPPER(TRIM(eq.sede)) = 'PATIOS'                               THEN 'PATIOS'
        ELSE UPPER(TRIM(eq.sede))
     END
SET eq.sede_id = s.id
WHERE eq.sede_id IS NULL AND eq.sede IS NOT NULL AND TRIM(eq.sede) <> '';

-- 3. Completar la sede en la hoja de vida inicial (migración 004)
UPDATE historial_asignaciones h
JOIN equipos eq ON eq.id = h.equipo_id
SET h.sede_nueva_id = eq.sede_id
WHERE h.sede_nueva_id IS NULL AND eq.sede_id IS NOT NULL
  AND h.observaciones LIKE 'Registro inicial%';

-- Verificar resultado
SELECT em.nombre AS empresa, s.nombre AS sede, COUNT(eq.id) AS equipos
FROM sedes s
JOIN empresas em ON em.id = s.empresa_id
LEFT JOIN equipos eq ON eq.sede_id = s.id
GROUP BY em.nombre, s.nombre
ORDER BY em.nombre, s.nombre;
SELECT COUNT(*) AS equipos_con_sede_texto_sin_vincular
FROM equipos WHERE sede_id IS NULL AND sede IS NOT NULL AND TRIM(sede) <> '';
