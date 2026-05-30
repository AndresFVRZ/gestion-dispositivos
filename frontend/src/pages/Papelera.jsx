// ==========================================
// 1. IMPORTACIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPapelera, restaurarEquipo, eliminarPermanente } from '../services/equiposService';
import { getEmpresas } from '../services/empresasService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/Common/ConfirmModal';

// ==========================================
// 2. LÓGICA DEL COMPONENTE
// ==========================================
function Papelera() {
  const { usuario } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const esSuperAdmin = usuario?.rol === 'super_admin';

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [papeleraData, empresasData] = await Promise.all([
        getPapelera(),
        getEmpresas()
      ]);
      if (papeleraData.success) setEquipos(papeleraData.data);
      if (empresasData.success) setEmpresas(empresasData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleRestaurar = (equipo) => {
    setConfirm({
      titulo: 'Restaurar equipo',
      mensaje: `¿Restaurar "${equipo.nombre_equipo}" del inventario activo?`,
      variante: 'info',
      textConfirmar: 'Restaurar',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const result = await restaurarEquipo(equipo.id);
          if (result.success) { toast.success(`Equipo ${equipo.codigo} restaurado`); cargarDatos(); }
          else toast.error(result.message || 'Error al restaurar');
        } catch { toast.error('Error de conexión'); }
      },
    });
  };

  const handleEliminarPermanente = (equipo) => {
    setConfirm({
      titulo: 'Eliminar permanentemente',
      mensaje: `Esta acción no se puede deshacer. ¿Eliminar definitivamente "${equipo.nombre_equipo}"?`,
      variante: 'danger',
      textConfirmar: 'Eliminar definitivamente',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const result = await eliminarPermanente(equipo.id);
          if (result.success) { toast.success(`Equipo ${equipo.codigo} eliminado permanentemente`); cargarDatos(); }
          else toast.error(result.message || 'Error al eliminar');
        } catch { toast.error('Error de conexión'); }
      },
    });
  };

  const toggleModoSeleccion = () => {
    setModoSeleccion(v => !v);
    setSeleccionados([]);
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === equiposFiltrados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(equiposFiltrados.map(e => e.id));
    }
  };

  const handleRestaurarSeleccionados = () => {
    if (seleccionados.length === 0) return;
    setConfirm({
      titulo: 'Restaurar seleccionados',
      mensaje: `¿Restaurar ${seleccionados.length} equipo(s) al inventario activo?`,
      variante: 'info',
      textConfirmar: `Restaurar ${seleccionados.length}`,
      onConfirm: async () => {
        setConfirm(null);
        let restaurados = 0;
        for (const id of seleccionados) {
          try { const r = await restaurarEquipo(id); if (r.success) restaurados++; } catch (_) {}
        }
        toast.success(`${restaurados} equipo(s) restaurados`);
        setSeleccionados([]);
        setModoSeleccion(false);
        cargarDatos();
      },
    });
  };

  const handleEliminarSeleccionados = () => {
    if (seleccionados.length === 0) return;
    setConfirm({
      titulo: 'Eliminar permanentemente',
      mensaje: `Esta acción no se puede deshacer. ¿Eliminar definitivamente ${seleccionados.length} equipo(s)?`,
      variante: 'danger',
      textConfirmar: `Eliminar ${seleccionados.length} definitivamente`,
      onConfirm: async () => {
        setConfirm(null);
        let eliminados = 0;
        for (const id of seleccionados) {
          try { const r = await eliminarPermanente(id); if (r.success) eliminados++; } catch (_) {}
        }
        toast.success(`${eliminados} equipo(s) eliminados permanentemente`);
        setSeleccionados([]);
        setModoSeleccion(false);
        cargarDatos();
      },
    });
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const equiposFiltrados = equipos.filter(equipo => {
    if (!filtroBusqueda) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    return equipo.codigo?.toLowerCase().includes(busqueda) ||
           equipo.nombre_equipo?.toLowerCase().includes(busqueda);
  });

  if (cargando) {
    return <div className="papelera-loading">Cargando papelera...</div>;
  }

  return (
    <div className="papelera-container">
      <ConfirmModal
        open={confirm !== null}
        titulo={confirm?.titulo}
        mensaje={confirm?.mensaje}
        variante={confirm?.variante}
        textConfirmar={confirm?.textConfirmar}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
      <div className="papelera-header">
        <div>
          <h1 className="papelera-title">Papelera</h1>
          <p className="papelera-subtitle">Equipos eliminados</p>
        </div>
        <button
          className={modoSeleccion ? 'pap-btn-seleccion-activa' : 'pap-btn-seleccion'}
          onClick={toggleModoSeleccion}
        >
          {modoSeleccion ? 'Cancelar selección' : 'Selección múltiple'}
        </button>
      </div>

      {modoSeleccion && (
        <div className="pap-barra-seleccion">
          <span className="pap-seleccion-info">
            {seleccionados.length === 0
              ? 'Selecciona los equipos que deseas restaurar o eliminar'
              : `${seleccionados.length} equipo(s) seleccionado(s)`}
          </span>
          <div className="pap-barra-acciones">
            <button
              className="pap-btn-restaurar-masivo"
              onClick={handleRestaurarSeleccionados}
              disabled={seleccionados.length === 0}
            >
              Restaurar ({seleccionados.length})
            </button>
            <button
              className="pap-btn-eliminar-masivo"
              onClick={handleEliminarSeleccionados}
              disabled={seleccionados.length === 0}
            >
              Eliminar definitivo ({seleccionados.length})
            </button>
          </div>
        </div>
      )}

      {mensaje && <div className="papelera-mensaje">{mensaje}</div>}

      <div className="papelera-filter">
        <input
          type="text"
          className="papelera-filter-input"
          value={filtroBusqueda}
          onChange={(e) => { setFiltroBusqueda(e.target.value); }}
          placeholder="Buscar por nombre o codigo..."
        />
      </div>

      <div className="papelera-table-container">
        <div className="papelera-table-wrapper">
          <table className="papelera-table">
            <thead>
              <tr>
                {modoSeleccion && (
                  <th className="pap-th-check">
                    <input
                      type="checkbox"
                      className="pap-checkbox"
                      checked={equiposFiltrados.length > 0 && seleccionados.length === equiposFiltrados.length}
                      onChange={toggleSeleccionarTodos}
                    />
                  </th>
                )}
                {esSuperAdmin && <th>Empresa</th>}
                <th>Codigo</th>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Eliminado el</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={(modoSeleccion ? 1 : 0) + (esSuperAdmin ? 1 : 0) + 6} className="papelera-empty">
                    No hay equipos en la papelera
                  </td>
                </tr>
              ) : (
                equiposFiltrados.map((equipo) => {
                  const empresa = empresas.find(e => e.id === equipo.empresa_id);
                  const seleccionado = seleccionados.includes(equipo.id);
                  return (
                    <tr
                      key={equipo.id}
                      className={seleccionado ? 'pap-fila-sel' : ''}
                      onClick={modoSeleccion ? () => toggleSeleccion(equipo.id) : undefined}
                      style={modoSeleccion ? { cursor: 'pointer' } : {}}
                    >
                      {modoSeleccion && (
                        <td className="pap-td-check" onClick={ev => ev.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="pap-checkbox"
                            checked={seleccionado}
                            onChange={() => toggleSeleccion(equipo.id)}
                          />
                        </td>
                      )}
                      {esSuperAdmin && <td>{empresa?.nombre || '-'}</td>}
                      <td className="papelera-codigo">{equipo.codigo || '-'}</td>
                      <td className="papelera-equipo">{equipo.nombre_equipo || '-'}</td>
                      <td>{equipo.tipo || '-'}</td>
                      <td>{equipo.estado || '-'}</td>
                      <td className="papelera-fecha">{formatFecha(equipo.eliminado_en)}</td>
                      <td className="papelera-acciones">
                        {!modoSeleccion && <button className="papelera-btn-restaurar" onClick={() => handleRestaurar(equipo)}>Restaurar</button>}
                        {!modoSeleccion && <button className="papelera-btn-eliminar" onClick={() => handleEliminarPermanente(equipo)}>Eliminar</button>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Papelera;

// ==========================================
// 3. ESTILOS COMPACTOS
// ==========================================
const papeleraStyles = document.createElement('style');
papeleraStyles.textContent = `
  .papelera-container {
    padding: 16px;
    max-width: 100%;
    margin: 0;
  }

  .papelera-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .papelera-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a2c3e;
    margin: 0 0 2px 0;
  }

  .papelera-subtitle {
    font-size: 11px;
    color: #718096;
    margin: 0;
  }

  .papelera-mensaje {
    background: #d1fae5;
    color: #065f46;
    padding: 6px 10px;
    border-radius: 5px;
    margin-bottom: 12px;
    font-size: 11px;
  }

  .papelera-filter {
    background: white;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 12px;
    border: 1px solid #e2e8f0;
  }

  .papelera-filter-input {
    width: 100%;
    max-width: 220px;
    padding: 5px 8px;
    border: 1px solid #d1dce6;
    border-radius: 5px;
    font-size: 11px;
    outline: none;
  }

  .papelera-filter-input:focus {
    border-color: #1a3a5c;
    box-shadow: 0 0 0 2px rgba(26,58,92,0.1);
  }

  .papelera-table-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    width: 100%;
  }

  .papelera-table-wrapper {
    overflow-x: auto;
  }

  .papelera-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
  }

  .papelera-table th {
    padding: 8px 10px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .papelera-table td {
    padding: 8px 10px;
    font-size: 11px;
    color: #1a2c3e;
    border-bottom: 1px solid #f1f5f9;
  }

  .papelera-table tbody tr:hover {
    background: #f8fafc;
  }

  .papelera-codigo {
    font-weight: 600;
    color: #1a3a5c;
  }

  .papelera-equipo {
    font-weight: 500;
  }

  .papelera-fecha {
    font-size: 10px;
    color: #718096;
    white-space: nowrap;
  }

  .papelera-acciones {
    white-space: nowrap;
  }

  .papelera-btn-restaurar {
    background: #e0f2fe;
    color: #0369a1;
    padding: 3px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    font-weight: 500;
    margin-right: 5px;
  }

  .papelera-btn-restaurar:hover {
    background: #bae6fd;
  }

  .papelera-btn-eliminar {
    background: #fee2e2;
    color: #dc2626;
    padding: 3px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    font-weight: 500;
  }

  .papelera-btn-eliminar:hover {
    background: #fecaca;
  }

  .papelera-empty {
    text-align: center;
    padding: 30px;
    color: #94a3b8;
    font-size: 11px;
  }

  .papelera-loading {
    text-align: center;
    padding: 30px;
    color: #718096;
    font-size: 11px;
  }

  /* Selección múltiple */
  .pap-btn-seleccion {
    padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 500;
    cursor: pointer; background: white; color: #475569;
    border: 1px solid #e2e8f0; transition: background 0.15s;
  }
  .pap-btn-seleccion:hover { background: #f1f5f9; }
  .pap-btn-seleccion-activa {
    padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 500;
    cursor: pointer; background: #fef3c7; color: #b45309;
    border: 1px solid #fcd34d;
  }
  .pap-barra-seleccion {
    display: flex; align-items: center; justify-content: space-between;
    background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 12px; gap: 12px; flex-wrap: wrap;
  }
  .pap-seleccion-info { font-size: 12px; font-weight: 500; color: #92400e; }
  .pap-barra-acciones { display: flex; gap: 8px; flex-wrap: wrap; }
  .pap-btn-restaurar-masivo {
    background: #0369a1; color: white; border: none; border-radius: 6px;
    padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .pap-btn-restaurar-masivo:hover:not(:disabled) { background: #0284c7; }
  .pap-btn-restaurar-masivo:disabled { background: #bae6fd; cursor: not-allowed; }
  .pap-btn-eliminar-masivo {
    background: #dc2626; color: white; border: none; border-radius: 6px;
    padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .pap-btn-eliminar-masivo:hover:not(:disabled) { background: #b91c1c; }
  .pap-btn-eliminar-masivo:disabled { background: #fca5a5; cursor: not-allowed; }
  .pap-th-check, .pap-td-check { width: 36px; text-align: center; padding: 6px 4px !important; }
  .pap-checkbox { width: 15px; height: 15px; cursor: pointer; accent-color: #2563eb; }
  .pap-fila-sel { background: #eff6ff !important; }

  @media (max-width: 768px) {
    .papelera-container {
      padding: 10px;
    }
    
    .papelera-filter-input {
      max-width: 100%;
    }
  }
`;
document.head.appendChild(papeleraStyles);