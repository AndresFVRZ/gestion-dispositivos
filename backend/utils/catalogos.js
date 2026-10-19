// utils/catalogos.js
// Catálogos fijos de equipos (garantía, estados, RAM) y normalización de RAM / procesador.

// ==========================================
// GARANTÍA
// Se guarda en equipos.garantia como días totales, igual que el frontend
// (utils/garantia.js → aTotalDias: meses × 30, años × 365).
// ==========================================
const GARANTIAS = [
    { codigo: '6_meses', label: '6 meses', valor: 6, unidad: 'meses', dias: 180 },
    { codigo: '1_anio',  label: '1 año',   valor: 1, unidad: 'años',  dias: 365 },
    { codigo: '3_anios', label: '3 años',  valor: 3, unidad: 'años',  dias: 1095 },
];
const DIAS_GARANTIA_VALIDOS = GARANTIAS.map(g => g.dias);

// Mismos umbrales que calcularGarantia() del frontend
const ESTADOS_GARANTIA = [
    { codigo: 'vigente',      label: 'Vigente' },
    { codigo: 'proxima',      label: 'Vence en 6 meses o menos' },
    { codigo: 'critica',      label: 'Vence en 30 días o menos' },
    { codigo: 'vencida',      label: 'Vencida' },
    { codigo: 'sin_garantia', label: 'Sin garantía registrada' },
];

const GARANTIA_FIN_SQL = 'DATE_ADD(eq.fecha_garantia, INTERVAL eq.garantia DAY)';
const GARANTIA_ESTADO_SQL = `
    CASE
        WHEN eq.fecha_garantia IS NULL OR eq.garantia IS NULL OR eq.garantia <= 0 THEN 'sin_garantia'
        WHEN ${GARANTIA_FIN_SQL} <= CURDATE() THEN 'vencida'
        WHEN DATEDIFF(${GARANTIA_FIN_SQL}, CURDATE()) <= 30 THEN 'critica'
        WHEN DATEDIFF(${GARANTIA_FIN_SQL}, CURDATE()) <= 180 THEN 'proxima'
        ELSE 'vigente'
    END`;

// ==========================================
// ESTADOS DE EQUIPO
// Debe coincidir con el CHECK chk_equipos_estado (migración 004).
// ==========================================
const ESTADOS = [
    { valor: 'Disponible',    requiere_observaciones: false, solo_gerencia: false },
    { valor: 'Asignado',      requiere_observaciones: false, solo_gerencia: false },
    { valor: 'Préstamo',      requiere_observaciones: false, solo_gerencia: false },
    { valor: 'Mantenimiento', requiere_observaciones: true,  solo_gerencia: false },
    { valor: 'Averiado',      requiere_observaciones: true,  solo_gerencia: false },
    { valor: 'Dañado',        requiere_observaciones: true,  solo_gerencia: false },
    { valor: 'Obsoleto',      requiere_observaciones: false, solo_gerencia: false },
    { valor: 'Baja',          requiere_observaciones: true,  solo_gerencia: true  },
    { valor: 'Canibalizar',   requiere_observaciones: true,  solo_gerencia: true  },
    { valor: 'Activo',        requiere_observaciones: false, solo_gerencia: false },
];
const ESTADOS_VALIDOS = ESTADOS.map(e => e.valor);
const ESTADOS_CON_OBSERVACIONES = ESTADOS.filter(e => e.requiere_observaciones).map(e => e.valor);

// ==========================================
// RAM
// ==========================================
const RAM_ESTANDAR_GB = [4, 8, 12, 16, 32, 64];

// "8,00 GB" / "8GB" / "12, 0 GB" / "16" → 8 / 8 / 12 / 16.  "N/A" → null
const ramGb = (valor) => {
    if (valor === null || valor === undefined) return null;
    const m = String(valor).trim().match(/^(\d+)(?:\s*[.,]\s*(\d+))?\s*(GB|G|MB)?$/i);
    if (!m) return null;
    let gb = parseFloat(`${m[1]}.${m[2] || 0}`);
    if (m[3] && m[3].toUpperCase() === 'MB') gb = gb / 1024;
    return gb > 0 ? Math.round(gb * 100) / 100 : null;
};

// Formato único "N GB"; si no se reconoce se deja el texto tal cual (recortado)
const normalizarRam = (valor) => {
    if (valor === null || valor === undefined) return valor;
    const texto = String(valor).trim();
    const gb = ramGb(texto);
    return gb ? `${gb} GB` : texto;
};

// ==========================================
// PROCESADOR
// ==========================================
const FAMILIAS_PROCESADOR = [
    'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
    'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9',
    'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
    'Intel Celeron', 'Intel Pentium', 'Intel Xeon', 'Apple M',
];

// Espacios colapsados y en mayúsculas (convención de los datos importados)
const normalizarProcesador = (valor) => {
    if (valor === null || valor === undefined) return valor;
    return String(valor).replace(/\s+/g, ' ').trim().toUpperCase();
};

// "INTEL CORE I 5-13420H 2,10 GHZ" → "Intel Core i5";  "AMD RYZEN 7 1,80 GHZ" → "AMD Ryzen 7"
const familiaProcesador = (valor) => {
    const u = normalizarProcesador(valor);
    if (!u) return null;
    let m;
    if ((m = u.match(/ULTRA\s*([579])\b/)))               return `Intel Core Ultra ${m[1]}`;
    if ((m = u.match(/R[YA]ZEN\s*([3579])\b/)))           return `AMD Ryzen ${m[1]}`;
    if ((m = u.match(/(?:CORE\s*|\b)I\s?-?([3579])(?=[\s-]|\d{3,}|$)/))) return `Intel Core i${m[1]}`;
    if (u.includes('CELERON'))                          return 'Intel Celeron';
    if (u.includes('PENTIUM'))                          return 'Intel Pentium';
    if (u.includes('XEON'))                             return 'Intel Xeon';
    if (/\bAPPLE\b|\bM[1-4]\b/.test(u))                 return 'Apple M';
    if (u.includes('INTEL'))                            return 'Intel (otro)';
    if (u.includes('AMD'))                              return 'AMD (otro)';
    return 'Otro';
};

module.exports = {
    GARANTIAS,
    DIAS_GARANTIA_VALIDOS,
    ESTADOS_GARANTIA,
    GARANTIA_FIN_SQL,
    GARANTIA_ESTADO_SQL,
    ESTADOS,
    ESTADOS_VALIDOS,
    ESTADOS_CON_OBSERVACIONES,
    RAM_ESTANDAR_GB,
    ramGb,
    normalizarRam,
    FAMILIAS_PROCESADOR,
    normalizarProcesador,
    familiaProcesador,
};
