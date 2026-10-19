// utils/hojaVida.js
// Registra en historial_asignaciones cada cambio de asignación, sede o estado de un equipo.

const vacio = (v) => v === null || v === undefined || String(v).trim() === '';
const texto = (v) => (vacio(v) ? null : String(v).trim());
const mismo = (a, b) => (texto(a) || '') === (texto(b) || '');

// Elige el tipo de movimiento según lo que cambió (en orden de importancia)
const tipoMovimiento = (antes, despues) => {
    if (!mismo(antes.asignado_a, despues.asignado_a)) {
        if (vacio(antes.asignado_a)) return 'ASIGNACION';
        if (vacio(despues.asignado_a)) return 'DEVOLUCION';
        return 'REASIGNACION';
    }
    if (!mismo(antes.prestado_a_empresa_id, despues.prestado_a_empresa_id) && !vacio(despues.prestado_a_empresa_id))
        return 'PRESTAMO';
    if (!mismo(antes.sede_id, despues.sede_id)) return 'TRASLADO';
    if (!mismo(antes.estado, despues.estado)) {
        if (['Baja', 'Canibalizar'].includes(despues.estado)) return 'BAJA';
        if (despues.estado === 'Préstamo') return 'PRESTAMO';
        return 'CAMBIO_ESTADO';
    }
    return null;
};

/**
 * @param runner  pool o client de transacción
 * @param req     petición (para saber quién hizo el cambio)
 * @param antes   estado previo del equipo ({} al crear)
 * @param despues estado nuevo del equipo (debe traer id)
 * @param observaciones texto libre opcional
 */
const registrarMovimiento = async (runner, req, antes, despues, observaciones = null) => {
    const tipo = tipoMovimiento(antes || {}, despues);
    if (!tipo) return null;

    const usuario = req.usuario || {};
    const ins = await runner.query(
        `INSERT INTO historial_asignaciones
            (equipo_id, tipo_movimiento, asignado_anterior, asignado_nuevo,
             estado_anterior, estado_nuevo, sede_anterior_id, sede_nueva_id,
             empresa_id, realizado_por, realizado_por_nombre, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            despues.id, tipo,
            texto(antes?.asignado_a), texto(despues.asignado_a),
            texto(antes?.estado), texto(despues.estado),
            antes?.sede_id || null, despues.sede_id || null,
            despues.empresa_id || null,
            usuario.id || null, usuario.nombre || null,
            texto(observaciones),
        ]
    );
    return ins.insertId;
};

module.exports = { registrarMovimiento, tipoMovimiento };
