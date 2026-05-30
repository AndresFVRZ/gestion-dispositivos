/**
 * Calcula el tiempo restante de garantía de un equipo.
 * @param {string|Date} fechaAsignacion - Fecha de asignación/inicio de garantía
 * @param {number|string} garantiaMeses - Duración de la garantía en meses
 * @returns {object} Resultado del cálculo
 */
export const calcularGarantia = (fechaAsignacion, garantiaMeses) => {
  if (!fechaAsignacion || !garantiaMeses) {
    return { tiene: false };
  }

  const meses = parseInt(garantiaMeses);
  if (isNaN(meses) || meses <= 0) return { tiene: false };

  const inicio = new Date(fechaAsignacion);
  if (isNaN(inicio.getTime())) return { tiene: false };

  // Fecha de vencimiento
  const fin = new Date(inicio);
  fin.setMonth(fin.getMonth() + meses);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  const vencida = fin <= hoy;

  // Diferencia en días totales
  const diffMs = fin - hoy;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Desglose en años, meses y días restantes
  let años = 0, mesesRestantes = 0, diasRestantes = 0;

  if (!vencida) {
    let tempFecha = new Date(hoy);
    años = fin.getFullYear() - tempFecha.getFullYear();
    mesesRestantes = fin.getMonth() - tempFecha.getMonth();
    diasRestantes = fin.getDate() - tempFecha.getDate();

    if (diasRestantes < 0) {
      mesesRestantes--;
      // Días del mes anterior
      const mesAnterior = new Date(fin.getFullYear(), fin.getMonth(), 0);
      diasRestantes += mesAnterior.getDate();
    }
    if (mesesRestantes < 0) {
      años--;
      mesesRestantes += 12;
    }
  } else {
    // Cuánto tiempo lleva vencida
    const diffVencida = Math.abs(diffDias);
    años = Math.floor(diffVencida / 365);
    mesesRestantes = Math.floor((diffVencida % 365) / 30);
    diasRestantes = diffVencida % 30;
  }

  // Estado de la garantía
  let estado;
  if (vencida) estado = 'vencida';
  else if (diffDias <= 30) estado = 'critica';
  else if (diffDias <= 180) estado = 'proxima';
  else estado = 'vigente';

  return {
    tiene: true,
    vencida,
    estado,           // 'vigente' | 'proxima' | 'critica' | 'vencida'
    años,
    meses: mesesRestantes,
    dias: diasRestantes,
    diasTotales: Math.abs(diffDias),
    fechaFin: fin,
    fechaFinTexto: fin.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
  };
};

/**
 * Texto resumido del tiempo restante/vencido.
 */
export const textoGarantia = (g) => {
  if (!g?.tiene) return '-';
  const partes = [];
  if (g.años > 0)  partes.push(`${g.años} año${g.años > 1 ? 's' : ''}`);
  if (g.meses > 0) partes.push(`${g.meses} mes${g.meses > 1 ? 'es' : ''}`);
  if (g.dias > 0 || partes.length === 0) partes.push(`${g.dias} día${g.dias !== 1 ? 's' : ''}`);
  const tiempo = partes.join(', ');
  return g.vencida ? `Vencida hace ${tiempo}` : `${tiempo}`;
};

/**
 * Color según estado de garantía.
 */
export const colorGarantia = (estado) => {
  const map = {
    vigente:  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    proxima:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    critica:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    vencida:  { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  };
  return map[estado] || map.vencida;
};
