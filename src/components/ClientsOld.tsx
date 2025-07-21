import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Client } from '../types/database';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    status: 'nuevo' as 'nuevo' | 'contactado' | 'en_visita' | 'negociando' | 'cerrado',
    preferences: '',
    budget: ''
  });

  const loadClients = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clientData = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null
      };

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingClient(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        notes: '',
        status: 'nuevo',
        preferences: '',
        budget: ''
      });
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || '',
      status: 'nuevo',
      preferences: '',
      budget: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente');
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando clientes...</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 30 
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827' }}>Clientes</h1>
          <p style={{ color: '#6b7280', marginTop: 5 }}>
            Gestiona tu cartera de clientes y leads
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingClient(null);
            setFormData({
              full_name: '',
              email: '',
              phone: '',
              notes: '',
              status: 'nuevo',
              preferences: '',
              budget: ''
            });
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Nuevo Cliente
        </button>
      </div>

      {/* Lista de clientes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 20
      }}>
        {clients.map((client) => (
          <div
            key={client.id}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: 24
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 15
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginRight: 15
              }}>
                {client.full_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: '#111827' }}>
                  {client.full_name}
                </h3>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Nuevo Lead
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              {client.email && (
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0 0 5px 0', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {client.email}
                </p>
              )}
              {client.phone && (
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0 0 5px 0', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {client.phone}
                </p>
              )}
            </div>

            {client.notes && (
              <div style={{ marginBottom: 15 }}>
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  lineHeight: 1.4,
                  backgroundColor: '#f9fafb',
                  padding: 10,
                  borderRadius: 6,
                  margin: 0
                }}>
                  {client.notes}
                </p>
              </div>
            )}

            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: 15
            }}>
              Creado: {new Date(client.created_at).toLocaleDateString()}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleEdit(client)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Editar
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Ver Propiedades
              </button>
              <button
                onClick={() => handleDelete(client.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#d1d5db',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          backgroundColor: 'white',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: 20, 
            color: '#d1d5db'
          }}>⚑</div>
          <h3 style={{ color: '#6b7280' }}>No hay clientes aún</h3>
          <p style={{ color: '#9ca3af' }}>Comienza agregando tu primer cliente</p>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Notas / Preferencias
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                  placeholder="Zona preferida, tipo de propiedad, presupuesto, etc..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {editingClient ? 'Actualizar' : 'Crear'} Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
