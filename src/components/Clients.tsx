import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      // Obtener la agencia del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single();

      if (!profile?.agency_id) throw new Error('Usuario sin agencia asignada');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', profile.agency_id)
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
      // Obtener la agencia del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single();

      if (!profile?.agency_id) throw new Error('Usuario sin agencia asignada');

      if (selectedClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', selectedClient.id)
          .eq('agency_id', profile.agency_id); // Verificar que pertenece a la agencia
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...formData, agency_id: profile.agency_id }]);
        if (error) throw error;
      }

      setShowModal(false);
      setSelectedClient(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        notes: ''
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
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        // Obtener la agencia del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data: profile } = await supabase
          .from('profiles')
          .select('agency_id')
          .eq('id', user.id)
          .single();

        if (!profile?.agency_id) throw new Error('Usuario sin agencia asignada');

        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('agency_id', profile.agency_id); // Verificar que pertenece a la agencia
        
        if (error) throw error;
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (client.phone && client.phone.includes(searchTerm));
    return matchesSearch;
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
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-black/80 dark:hover:bg-white/80 hover:scale-[1.02] transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-black dark:text-white">{client.email || 'Sin email'}</div>
                        {client.phone && (
                          <div className="text-xs text-black/60 dark:text-white/60">{client.phone}</div>
                        )}
                      </div>
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
                          className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-110 transition-all"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full hover:scale-110 transition-all"
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
                {searchTerm 
                  ? 'No se encontraron clientes con los filtros aplicados' 
                  : 'Comienza agregando tu primer cliente'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-black/80 dark:hover:bg-white/80 hover:scale-[1.02] transition-all mx-auto"
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
                      notes: ''
                    });
                  }}
                  className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-110 transition-all"
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
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

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
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-[1.02] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-black/80 dark:hover:bg-white/80 hover:scale-[1.02] transition-all disabled:opacity-50"
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
