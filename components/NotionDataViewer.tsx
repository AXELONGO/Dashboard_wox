import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Database,
  FileText,
  Calendar,
  User,
  Building2,
  Phone,
  Globe,
  Filter,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';
import { getLeadsFromNotion, getHistoryFromNotionDatabase, deletePage, updatePage } from '../services/notionService';
import { Lead, HistoryItem } from '../types';

const NotionDataViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'history'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // CRUD State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsData, historyData] = await Promise.all([
        getLeadsFromNotion(),
        getHistoryFromNotionDatabase()
      ]);
      setLeads(leadsData);
      setHistory(historyData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching Notion data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsProcessing(true);
    const success = await deletePage(deletingId);
    if (success) {
      setDeletingId(null);
      await fetchData(); // Refresh data
    } else {
      alert("Error al eliminar. Verifica los permisos.");
    }
    setIsProcessing(false);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setIsProcessing(true);

    let properties: any = {};

    if (activeTab === 'leads') {
      // Mapeo para Leads (ajusta según tus nombres reales de columnas en Notion)
      // Usamos la info de notionData si existe, o defaults
      const lead = editingItem as Lead;
      const nameKey = 'Name'; // Standard
      const classKey = lead.notionData?.claseColName || 'Clase';
      const agentKey = 'Responsable'; // Asumido

      properties[nameKey] = { title: [{ text: { content: lead.name } }] };

      // Clase (Select)
      if (lead.notionData?.claseColType === 'rich_text') {
        properties[classKey] = { rich_text: [{ text: { content: lead.clase } }] };
      } else {
        properties[classKey] = { select: { name: lead.clase } };
      }

      // Agent (Select)
      properties[agentKey] = { select: { name: lead.agent } };

    } else {
      // Mapeo para History
      const item = editingItem as HistoryItem;
      // Asumimos nombres estándar
      properties['Comentario'] = { rich_text: [{ text: { content: item.description } }] };
    }

    const success = await updatePage(editingItem.id, properties);

    if (success) {
      setEditingItem(null);
      await fetchData();
    } else {
      alert("Error al actualizar. Verifica los permisos.");
    }
    setIsProcessing(false);
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.agent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.clase?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = history.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = () => {
    const data = activeTab === 'leads' ? filteredLeads : filteredHistory;
    if (data.length === 0) return;

    const headers = activeTab === 'leads'
      ? ['ID', 'Nombre', 'Dirección', 'Teléfono', 'Web', 'Clase', 'Responsable']
      : ['ID', 'Tipo', 'Cliente', 'Asesor', 'Descripción', 'Fecha'];

    const rows = activeTab === 'leads'
      ? (data as Lead[]).map(l => [l.id, l.name, l.address, l.phone, l.website, l.clase, l.agent])
      : (data as HistoryItem[]).map(h => [h.id, h.type, h.clientName || h.clientId, h.user.name, h.description, h.timestamp]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => '"' + (cell || '') + '"').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'notion_' + activeTab + '_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-hidden relative">

      {/* --- MODALS --- */}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-bold">¿Eliminar registro?</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Esta acción archivará el registro en Notion. Podrás restaurarlo desde la papelera de Notion si es necesario.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                Editar {activeTab === 'leads' ? 'Lead' : 'Nota'}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'leads' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Empresa</label>
                    <input
                      type="text"
                      value={(editingItem as Lead).name}
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Clase</label>
                      <select
                        value={(editingItem as Lead).clase}
                        onChange={e => setEditingItem({ ...editingItem, clase: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                      >
                        <option value="A">Clase A</option>
                        <option value="B">Clase B</option>
                        <option value="C">Clase C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Responsable</label>
                      <select
                        value={(editingItem as Lead).agent || ''}
                        onChange={e => setEditingItem({ ...editingItem, agent: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                      >
                        <option value="Sin Asignar">Sin Asignar</option>
                        <option value="Asesor 1">Asesor 1</option>
                        <option value="Asesor 2">Asesor 2</option>
                        <option value="Asesor 3">Asesor 3</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descripción / Nota</label>
                  <textarea
                    rows={4}
                    value={(editingItem as HistoryItem).description}
                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Base de Datos Notion
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visualización y gestión directa de tus datos en Notion
            {lastUpdated && <span className="ml-2 text-xs opacity-70">Actualizado: {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-fit">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'leads' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
          >
            Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
          >
            Historial ({history.length})
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar en ${activeTab === 'leads' ? 'leads' : 'historial'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="flex-1 overflow-auto bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-2" />
            <p>Cargando datos de Notion...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                {activeTab === 'leads' ? (
                  <>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Empresa</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Clase</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Contacto</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Responsable</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700 text-right">Acciones</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Fecha</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Tipo</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Cliente</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Detalle</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700">Asesor</th>
                    <th className="p-4 font-semibold text-slate-300 border-b border-slate-700 text-right">Acciones</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {activeTab === 'leads' ? (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium text-white">{lead.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" /> {lead.address || 'Sin dirección'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${lead.clase === 'A' ? 'bg-green-500/20 text-green-400' :
                          lead.clase === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-600/30 text-slate-400'
                        }`}>
                        {lead.clase || 'C'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</div>}
                      {lead.website && <div className="flex items-center gap-1 mt-1"><Globe className="w-3 h-3" /> {lead.website}</div>}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {lead.agent || 'Sin asignar'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingItem(lead)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(lead.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredHistory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {item.timestamp}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'call' ? 'bg-purple-500/20 text-purple-400' :
                          item.type === 'email' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-600/30 text-slate-400'
                        }`}>
                        {item.title}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-white">
                      {item.clientName || 'Desconocido'}
                    </td>
                    <td className="p-4 text-sm text-slate-300 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {item.user.name}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {((activeTab === 'leads' && filteredLeads.length === 0) || (activeTab === 'history' && filteredHistory.length === 0)) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No se encontraron resultados para tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NotionDataViewer;
