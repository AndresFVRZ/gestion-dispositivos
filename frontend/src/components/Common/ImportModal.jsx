import React from 'react';

function ImportModal({ estado, progreso, total, importados, errores, onCerrar }) {
  if (estado === 'idle') return null;

  const pct = total > 0 ? Math.round((progreso / total) * 100) : 0;

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {estado === 'procesando' ? (
          <>
            <div style={s.spinnerWrap}>
              <div style={s.spinner} />
            </div>
            <h3 style={s.titulo}>Importando equipos...</h3>
            <p style={s.progText}>
              {progreso} de {total} procesados
            </p>
            <div style={s.barTrack}>
              <div style={{ ...s.barFill, width: `${pct}%` }} />
            </div>
            <p style={s.pct}>{pct}%</p>
          </>
        ) : (
          <>
            <div style={{ ...s.resultIcon, background: errores.length === 0 ? '#f0fdf4' : '#fffbeb' }}>
              {errores.length === 0 ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" width="32" height="32">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" width="32" height="32">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
            </div>

            <h3 style={s.titulo}>Importación completada</h3>

            <div style={s.resumen}>
              <div style={{ ...s.resCard, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <span style={{ ...s.resNum, color: '#16a34a' }}>{importados}</span>
                <span style={s.resLabel}>importados</span>
              </div>
              <div style={{ ...s.resCard, background: errores.length > 0 ? '#fef2f2' : '#f8fafc', borderColor: errores.length > 0 ? '#fecaca' : '#e2e8f0' }}>
                <span style={{ ...s.resNum, color: errores.length > 0 ? '#dc2626' : '#94a3b8' }}>{errores.length}</span>
                <span style={s.resLabel}>errores</span>
              </div>
            </div>

            {errores.length > 0 && (
              <div style={s.erroresWrap}>
                <p style={s.erroresTitulo}>Detalle de errores:</p>
                <ul style={s.erroresList}>
                  {errores.map((e, i) => (
                    <li key={i} style={s.errorItem}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <button style={s.btnCerrar} onClick={onCerrar}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px',
  },
  card: {
    background: 'white', borderRadius: '20px', padding: '40px 36px',
    maxWidth: '460px', width: '100%', textAlign: 'center',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    maxHeight: '85vh', overflowY: 'auto',
  },
  spinnerWrap: {
    display: 'flex', justifyContent: 'center', marginBottom: '20px',
  },
  spinner: {
    width: '56px', height: '56px',
    border: '5px solid #e2e8f0', borderTopColor: '#2563eb',
    borderRadius: '50%', animation: 'importSpin 0.8s linear infinite',
  },
  titulo: {
    fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px',
  },
  progText: {
    fontSize: '14px', color: '#64748b', margin: '0 0 16px',
  },
  barTrack: {
    height: '10px', background: '#e2e8f0', borderRadius: '99px',
    overflow: 'hidden', margin: '0 0 8px',
  },
  barFill: {
    height: '100%', background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
    borderRadius: '99px', transition: 'width 0.2s ease',
  },
  pct: {
    fontSize: '13px', color: '#94a3b8', margin: 0,
  },
  resultIcon: {
    width: '68px', height: '68px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  resumen: {
    display: 'flex', gap: '12px', justifyContent: 'center', margin: '16px 0 0',
  },
  resCard: {
    flex: 1, borderRadius: '12px', border: '1px solid',
    padding: '16px 8px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px', maxWidth: '120px',
  },
  resNum: {
    fontSize: '28px', fontWeight: '700', lineHeight: 1,
  },
  resLabel: {
    fontSize: '12px', color: '#64748b', fontWeight: '500',
  },
  erroresWrap: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '14px', margin: '20px 0 0',
    textAlign: 'left',
  },
  erroresTitulo: {
    fontSize: '12px', fontWeight: '600', color: '#dc2626',
    margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  erroresList: {
    margin: 0, padding: '0 0 0 16px',
    maxHeight: '160px', overflowY: 'auto',
  },
  errorItem: {
    fontSize: '12px', color: '#7f1d1d', marginBottom: '4px', lineHeight: '1.4',
  },
  btnCerrar: {
    marginTop: '24px', padding: '11px 40px',
    background: '#0f172a', color: 'white', border: 'none',
    borderRadius: '10px', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', width: '100%',
  },
};

const style = document.createElement('style');
style.textContent = `@keyframes importSpin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

export default ImportModal;
