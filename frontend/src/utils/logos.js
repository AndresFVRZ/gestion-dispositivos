import logoAccesalud    from '../assets/Accesalud.png';
import logoEmtra         from '../assets/Emtra.png';
import logoEmtraSur      from '../assets/EmtraSur.png';
import logoInprosalud    from '../assets/InprosaludPlus.png';
import logoSertti        from '../assets/Sertti.png';
import logoSoluciones    from '../assets/solucionescorp.png';
import logoSimadrid      from '../assets/simadrid.png';

// Mapa nombre de empresa → logo importado
const LOGOS = {
  'accesalud':        logoAccesalud,
  'emtra':            logoEmtra,
  'emtrasur':         logoEmtraSur,
  'inprosalud plus':  logoInprosalud,
  'inprosalud':       logoInprosalud,
  'sertti':           logoSertti,
  'solucionescorp':   logoSoluciones,
  'soluciones corp':  logoSoluciones,
  'simadrid':         logoSimadrid,
};

/**
 * Devuelve el logo para un nombre de empresa.
 * Hace coincidencia por nombre normalizado (minúsculas, sin espacios extras).
 * @param {string} nombre
 * @returns {string|null} URL del logo o null si no existe
 */
export const getLogoEmpresa = (nombre = '') => {
  const key = nombre.toLowerCase().trim();
  // Coincidencia exacta
  if (LOGOS[key]) return LOGOS[key];
  // Coincidencia parcial
  for (const [k, v] of Object.entries(LOGOS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
};

// Logo por defecto del sistema (EMTRA)
export const LOGO_SISTEMA = logoEmtra;
