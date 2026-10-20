// Colores distintivos por estado de equipo (tabla, detalle, hoja de vida y dashboards)
export const COLORES_ESTADO = {
  'Disponible':    { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' },
  'Asignado':      { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  'Préstamo':      { background: '#fefce8', color: '#b45309', borderColor: '#fde68a' },
  'Mantenimiento': { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' },
  'Averiado':      { background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' },
  'Dañado':        { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' },
  'Obsoleto':      { background: '#f5f5f4', color: '#57534e', borderColor: '#d6d3d1' },
  'Baja':          { background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' },
  'Canibalizar':   { background: '#fdf4ff', color: '#7c3aed', borderColor: '#e9d5ff' },
  'Activo':        { background: '#f0fdfa', color: '#0f766e', borderColor: '#99f6e4' },
};

const SIN_ESTADO = { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' };

export const colorEstado = (estado) => COLORES_ESTADO[estado] || SIN_ESTADO;

// Estilo listo para un <span> de estado
export const estiloBadgeEstado = (estado) => {
  const c = colorEstado(estado);
  return { background: c.background, color: c.color, border: `1px solid ${c.borderColor}` };
};
