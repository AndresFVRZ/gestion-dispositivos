import React from 'react';

const VARIANTES = {
  danger: {
    iconBg: '#fef2f2', iconColor: '#dc2626',
    btnBg: '#dc2626', btnBgHover: '#b91c1c',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14H6L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    ),
  },
  warning: {
    iconBg: '#fffbeb', iconColor: '#d97706',
    btnBg: '#d97706', btnBgHover: '#b45309',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  info: {
    iconBg: '#eff6ff', iconColor: '#2563eb',
    btnBg: '#2563eb', btnBgHover: '#1d4ed8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
};

function ConfirmModal({
  open,
  titulo,
  mensaje,
  variante = 'danger',
  textConfirmar = 'Confirmar',
  textCancelar = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const v = VARIANTES[variante] || VARIANTES.danger;

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        <div style={{ ...s.iconWrap, background: v.iconBg, color: v.iconColor }}>
          {v.icon}
        </div>
        <h3 style={s.titulo}>{titulo}</h3>
        <p style={s.mensaje}>{mensaje}</p>
        <div style={s.btns}>
          <button style={s.btnCancel} onClick={onCancel}>{textCancelar}</button>
          <button
            style={{ ...s.btnConfirm, background: v.btnBg }}
            onMouseEnter={e => (e.target.style.background = v.btnBgHover)}
            onMouseLeave={e => (e.target.style.background = v.btnBg)}
            onClick={onConfirm}
          >
            {textConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px',
  },
  card: {
    background: 'white', borderRadius: '20px', padding: '36px 32px',
    maxWidth: '420px', width: '100%', textAlign: 'center',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    animation: 'confirmIn 0.18s ease-out',
  },
  iconWrap: {
    width: '64px', height: '64px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  titulo: {
    fontSize: '18px', fontWeight: '700', color: '#0f172a',
    margin: '0 0 10px',
  },
  mensaje: {
    fontSize: '14px', color: '#64748b', margin: '0 0 28px', lineHeight: '1.6',
  },
  btns: {
    display: 'flex', gap: '12px', justifyContent: 'center',
  },
  btnCancel: {
    flex: 1, padding: '10px 0', borderRadius: '10px',
    border: '1px solid #e2e8f0', background: 'white',
    color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
  },
  btnConfirm: {
    flex: 1, padding: '10px 0', borderRadius: '10px',
    border: 'none', color: 'white',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

const style = document.createElement('style');
style.textContent = `@keyframes confirmIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`;
document.head.appendChild(style);

export default ConfirmModal;
