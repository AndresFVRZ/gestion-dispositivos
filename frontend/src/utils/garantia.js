/**
 * Convierte un valor con unidad a días totales.
 * @param {number} valor
 * @param {'días'|'meses'|'años'} unidad
 */
export const aTotalDias = (valor, unidad) => {
  const n = parseInt(valor);
  if (!n || n <= 0) return null;
  if (unidad === 'años')  return n * 365;
  if (unidad === 'meses') return n * 30;
  return n; // días
};

/**
 * Intenta descomponer un número de días en su representación más legible.
 */
export const diasADisplay = (dias) => {
  const n = parseInt(dias);
  if (!n || n <= 0) return { valor: '', unidad: 'meses' };
  if (n % 365 === 0) return { valor: n / 365, unidad: 'años' };
  if (n % 30  === 0) return { valor: n / 30,  unidad: 'meses' };
  return { valor: n, unidad: 'días' };
};

/**
 * Formatea días a texto legible: "2 años", "6 meses", "45 días".
 */
export const formatearDias = (dias) => {
  const { valor, unidad } = diasADisplay(dias);
  if (!valor) return '';
  const singular = { años: 'año', meses: 'mes', días: 'día' };
  const plural   = { años: 'años', meses: 'meses', días: 'días' };
  return `${valor} ${valor === 1 ? singular[unidad] : plural[unidad]}`;
};

/**
 * Calcula el tiempo restante de garantía de un equipo.
 * @param {string|Date} fechaAsignacion
 * @param {number} garantiaDias - Duración en días totales
 */
export const calcularGarantia = (fechaAsignacion, garantiaDias) => {
  if (!fechaAsignacion || !garantiaDias) return { tiene: false };

  const dias = parseInt(garantiaDias);
  if (isNaN(dias) || dias <= 0) return { tiene: false };

  const inicio = new Date(fechaAsignacion);
  if (isNaN(inicio.getTime())) return { tiene: false };

  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + dias);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  const vencida = fin <= hoy;
  const diffMs   = fin - hoy;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let años = 0, mesesRestantes = 0, diasRestantes = 0;

  if (!vencida) {
    let tempFecha = new Date(hoy);
    años          = fin.getFullYear() - tempFecha.getFullYear();
    mesesRestantes = fin.getMonth()   - tempFecha.getMonth();
    diasRestantes  = fin.getDate()    - tempFecha.getDate();

    if (diasRestantes < 0) {
      mesesRestantes--;
      const mesAnterior = new Date(fin.getFullYear(), fin.getMonth(), 0);
      diasRestantes += mesAnterior.getDate();
    }
    if (mesesRestantes < 0) {
      años--;
      mesesRestantes += 12;
    }
  } else {
    const diffVencida = Math.abs(diffDias);
    años           = Math.floor(diffVencida / 365);
    mesesRestantes = Math.floor((diffVencida % 365) / 30);
    diasRestantes  = diffVencida % 30;
  }

  let estado;
  if (vencida)         estado = 'vencida';
  else if (diffDias <= 30)  estado = 'critica';
  else if (diffDias <= 180) estado = 'proxima';
  else                 estado = 'vigente';

  return {
    tiene: true,
    vencida,
    estado,
    años,
    meses: mesesRestantes,
    dias:  diasRestantes,
    diasTotales: Math.abs(diffDias),
    fechaFin: fin,
    fechaFinTexto: fin.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
  };
};

export const textoGarantia = (g) => {
  if (!g?.tiene) return '-';
  const partes = [];
  if (g.años  > 0) partes.push(`${g.años} año${g.años !== 1 ? 's' : ''}`);
  if (g.meses > 0) partes.push(`${g.meses} mes${g.meses !== 1 ? 'es' : ''}`);
  if (g.dias  > 0 || partes.length === 0) partes.push(`${g.dias} día${g.dias !== 1 ? 's' : ''}`);
  return g.vencida ? `Vencida hace ${partes.join(', ')}` : partes.join(', ');
};

export const colorGarantia = (estado) => {
  const map = {
    vigente: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    proxima: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    critica: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    vencida: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  };
  return map[estado] || map.vencida;
};
