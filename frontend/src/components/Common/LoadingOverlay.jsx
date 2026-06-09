import React from 'react';

function LoadingOverlay({ mensaje = 'Guardando...' }) {
  return (
    <div className="loverlay-bg">
      <div className="loverlay-box">
        <div className="loverlay-spinner" />
        <span className="loverlay-text">{mensaje}</span>
      </div>
      <style>{`
        .loverlay-bg {
          position: fixed; inset: 0;
          background: rgba(15, 43, 92, 0.45);
          backdrop-filter: blur(3px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          animation: loverlay-in 0.15s ease;
        }
        @keyframes loverlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .loverlay-box {
          background: white;
          border-radius: 14px;
          padding: 24px 32px;
          display: flex; align-items: center; gap: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
        }
        .loverlay-spinner {
          width: 24px; height: 24px; flex-shrink: 0;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: loverlay-spin 0.7s linear infinite;
        }
        @keyframes loverlay-spin {
          to { transform: rotate(360deg); }
        }
        .loverlay-text {
          font-size: 14px; font-weight: 600; color: #1e293b;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

export default LoadingOverlay;
