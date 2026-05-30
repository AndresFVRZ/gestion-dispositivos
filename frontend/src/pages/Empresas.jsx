import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getEmpresas, crearEmpresa, actualizarEmpresa } from '../services/empresasService';
import ConfirmModal from '../components/Common/ConfirmModal';
import { getLogoEmpresa } from '../utils/logos';

function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await getEmpresas();
      if (res.success) setEmpresas(res.data);
    } catch { toast.error('Error al cargar empresas'); }
    finally { setCargando(false); }
  };

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setShowModal(true);
  };

  const abrirEditar = (empresa) => {
    setEditando(empresa);
    setNombre(empresa.nombre);
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setGuardando(true);
    try {
      const res = editando
        ? await actualizarEmpresa(editando.id, { nombre: nombre.trim() })
        : await crearEmpresa({ nombre: nombre.trim() });

      if (res.success) {
        toast.success(editando ? 'Empresa actualizada' : 'Empresa creada');
        setShowModal(false);
        cargar();
      } else {
        toast.error(res.message || 'Error al guardar');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setGuardando(false); }
  };

  if (cargando) return <div style={s.loading}>Cargando empresas...</div>;

  return (
    <div style={s.page}>
      <ConfirmModal
        open={confirm !== null}
        titulo={confirm?.titulo} mensaje={confirm?.mensaje}
        variante={confirm?.variante} textConfirmar={confirm?.textConfirmar}
        onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}
      />

      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Empresas</h1>
          <p style={s.sub}>Gestión de empresas del sistema</p>
        </div>
        <button style={s.btnPrimary} onClick={abrirCrear}>+ Nueva empresa</button>
      </div>

      <div style={s.grid}>
        {empresas.map(emp => {
          const logo = getLogoEmpresa(emp.nombre);
          return (
            <div key={emp.id} style={s.card}>
              <div style={s.cardLogo}>
                {logo
                  ? <img src={logo} alt={emp.nombre} style={s.logoImg} />
                  : <div style={s.logoPlaceholder}>{emp.nombre.charAt(0).toUpperCase()}</div>
                }
              </div>
              <div style={s.cardBody}>
                <p style={s.cardNombre}>{emp.nombre}</p>
                <button style={s.btnEdit} onClick={() => abrirEditar(emp)}>Editar nombre</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>{editando ? 'Editar empresa' : 'Nueva empresa'}</h2>
              <button style={s.btnClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <label style={s.label}>Nombre de la empresa *</label>
              <input
                style={s.input}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre de la empresa"
                autoFocus
              />
              {nombre.trim() && (
                <div style={s.preview}>
                  {getLogoEmpresa(nombre)
                    ? <img src={getLogoEmpresa(nombre)} alt="preview" style={s.previewImg} />
                    : <p style={s.previewNone}>Sin logo asociado para este nombre</p>
                  }
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
              <button style={s.btnPrimary} onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear empresa')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: '24px', background: '#f1f5f9', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' },
  sub: { fontSize: '13px', color: '#64748b', margin: 0 },
  loading: { textAlign: 'center', padding: '60px', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  card: { background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardLogo: { background: '#f8fafc', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', padding: '16px' },
  logoImg: { maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' },
  logoPlaceholder: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#0f2b5c,#2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700' },
  cardBody: { padding: '14px 16px' },
  cardNombre: { fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 10px' },
  btnPrimary: { background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnEdit: { background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
  modal: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #e2e8f0' },
  modalTitulo: { fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 },
  btnClose: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' },
  modalBody: { padding: '20px' },
  modalFooter: { padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  preview: { marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0' },
  previewImg: { maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' },
  previewNone: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  btnCancel: { background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer' },
};

export default Empresas;
