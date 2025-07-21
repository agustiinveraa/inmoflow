import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'potential';
  created_at: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', selectedClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData]);
        if (error) throw error;
      }

      setShowModal(false);
      setSelectedClient(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        status: 'active'
      });
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      status: client.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'inactive': return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
      case 'potential': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'potential': return 'Potencial';
      default: return status;
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.phone && client.phone.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading && !clients.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60 dark:text-white/60">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Clientes</h1>
            <p className="text-black/60 dark:text-white/60">Gestiona tu base de clientes</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="potential">Potencial</option>
          </select>
          <div className="text-sm text-black/60 dark:text-white/60 flex items-center">
            {filteredClients.length} de {clients.length} clientes
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Contacto</th>
                  <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Fecha Registro</th>
                  <th className="text-right py-3 px-4 font-semibold text-black dark:text-white text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                          <span className="text-white dark:text-black text-sm font-medium">
                            {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-black dark:text-white">{client.full_name}</div>
                          {client.address && (
                            <div className="text-sm text-black/60 dark:text-white/60 truncate max-w-xs">{client.address}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-black dark:text-white">{client.email}</div>
                        {client.phone && (
                          <div className="text-xs text-black/60 dark:text-white/60">{client.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                        {getStatusText(client.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-black/60 dark:text-white/60">
                        {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Icons.Delete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Icons.Clients className="w-16 h-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">No hay clientes</h3>
              <p className="text-black/60 dark:text-white/60 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No se encontraron clientes con los filtros aplicados' 
                  : 'Comienza agregando tu primer cliente'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors mx-auto"
              >
                <Icons.Plus className="w-4 h-4" />
                <span>Nuevo Cliente</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedClient(null);
                    setFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                      address: '',
                      notes: '',
                      status: 'active'
                    });
                  }}
                  className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="potential">Potencial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Notas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    placeholder="Información adicional sobre el cliente..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedClient(null);
                      setFormData({
                        full_name: '',
                        email: '',
                        phone: '',
                        address: '',
                        notes: '',
                        status: 'active'
                      });
                    }}
                    className="px-4 py-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors disabled:opacity-50"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>}
                    <span>{selectedClient ? 'Actualizar' : 'Crear'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
