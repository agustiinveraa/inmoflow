import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Visit, Client, Property } from '../types/database';

interface ExtendedVisit extends Visit {
  client?: Client;
  property?: Property;
}

export default function Visits() {
  const [visits, setVisits] = useState<ExtendedVisit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<ExtendedVisit | null>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    property_id: '',
    visit_date: '',
    notes: ''
  });

  const loadVisits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          client:clients(*),
          property:properties(*)
        `)
        .order('visit_date', { ascending: true });
      
      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClientsAndProperties = useCallback(async () => {
    try {
      const [clientsResult, propertiesResult] = await Promise.all([
        supabase.from('clients').select('*').order('full_name'),
        supabase.from('properties').select('*').order('title')
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;

      setClients(clientsResult.data || []);
      setProperties(propertiesResult.data || []);
    } catch (error) {
      console.error('Error loading clients and properties:', error);
    }
  }, []);

  useEffect(() => {
    loadVisits();
    loadClientsAndProperties();
  }, [loadVisits, loadClientsAndProperties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const visitData = {
        client_id: formData.client_id || null,
        property_id: formData.property_id || null,
        visit_date: formData.visit_date,
        notes: formData.notes || null
      };

      if (editingVisit) {
        const { error } = await supabase
          .from('visits')
          .update(visitData)
          .eq('id', editingVisit.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visits')
          .insert([visitData]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingVisit(null);
      setFormData({
        client_id: '',
        property_id: '',
        visit_date: '',
        notes: ''
      });
      loadVisits();
    } catch (error) {
      console.error('Error saving visit:', error);
      alert('Error al guardar la visita');
    }
  };

  const handleEdit = (visit: ExtendedVisit) => {
    setEditingVisit(visit);
    setFormData({
      client_id: visit.client_id || '',
      property_id: visit.property_id || '',
      visit_date: visit.visit_date.split('T')[0] + 'T' + visit.visit_date.split('T')[1]?.substring(0, 5) || '',
      notes: visit.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (visitId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta visita?')) return;
    
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);
      
      if (error) throw error;
      loadVisits();
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Error al eliminar la visita');
    }
  };

  const getVisitsForDate = (date: string) => {
    return visits.filter(visit => 
      visit.visit_date.startsWith(date)
    );
  };

  const getTodayVisits = () => {
    const today = new Date().toISOString().split('T')[0];
    return getVisitsForDate(today);
  };

  const getUpcomingVisits = () => {
    const today = new Date().toISOString().split('T')[0];
    return visits.filter(visit => 
      visit.visit_date >= today
    ).slice(0, 5);
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando visitas...</div>;
  }

  const todayVisits = getTodayVisits();
  const upcomingVisits = getUpcomingVisits();

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 30 
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827' }}>Agenda de Visitas</h1>
          <p style={{ color: '#6b7280', marginTop: 5 }}>
            Programa y gestiona las visitas a propiedades
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingVisit(null);
            setFormData({
              client_id: '',
              property_id: '',
              visit_date: '',
              notes: ''
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
          Nueva Visita
        </button>
      </div>

      {/* Resumen de hoy */}
      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: 20,
        marginBottom: 20
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#111827' }}>
          Visitas de Hoy ({todayVisits.length})
        </h3>
        {todayVisits.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayVisits.map((visit) => (
              <div key={visit.id} style={{
                backgroundColor: 'white',
                padding: 15,
                borderRadius: 6,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{visit.client?.full_name || 'Cliente no especificado'}</strong>
                    <br />
                    <span style={{ color: '#6b7280' }}>
                      {visit.property?.title || 'Propiedad no especificada'}
                    </span>
                    <br />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      {new Date(visit.visit_date).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={() => handleEdit(visit)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', margin: 0 }}>No hay visitas programadas para hoy</p>
        )}
      </div>

      {/* Próximas visitas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        marginBottom: 20
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#111827' }}>Próximas Visitas</h3>
          {upcomingVisits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingVisits.map((visit) => (
                <div key={visit.id} style={{
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  borderLeft: '4px solid #6b7280'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                    {visit.client?.full_name || 'Cliente no especificado'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {visit.property?.title || 'Propiedad no especificada'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {new Date(visit.visit_date).toLocaleDateString('es-ES')} - {new Date(visit.visit_date).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No hay visitas programadas</p>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#111827' }}>Estadísticas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 10,
              backgroundColor: '#f9fafb',
              borderRadius: 6
            }}>
              <span>Total Visitas:</span>
              <strong>{visits.length}</strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 10,
              backgroundColor: '#f3f4f6',
              borderRadius: 6
            }}>
              <span>Visitas Hoy:</span>
              <strong>{todayVisits.length}</strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 10,
              backgroundColor: '#f1f5f9',
              borderRadius: 6
            }}>
              <span>Próximas:</span>
              <strong>{upcomingVisits.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Lista completa de visitas */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#111827' }}>Todas las Visitas</h3>
        </div>
        
        {visits.length > 0 ? (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {visits.map((visit) => (
              <div key={visit.id} style={{
                padding: 20,
                borderBottom: '1px solid #f1f3f4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                    {visit.client?.full_name || 'Cliente no especificado'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: 3 }}>
                    {visit.property?.title || 'Propiedad no especificada'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: 3 }}>
                    {new Date(visit.visit_date).toLocaleDateString('es-ES')} - {new Date(visit.visit_date).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {visit.notes && (
                    <div style={{ color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
                      {visit.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEdit(visit)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(visit.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#6b7280'
          }}>
            <div style={{ 
              fontSize: '72px', 
              marginBottom: 15, 
              color: '#d1d5db'
            }}>◯</div>
            <p>No hay visitas programadas</p>
          </div>
        )}
      </div>

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
            padding: 30,
            borderRadius: 12,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingVisit ? 'Editar Visita' : 'Nueva Visita'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Cliente
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Propiedad
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Seleccionar propiedad...</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                  required
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
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Notas adicionales sobre la visita..."
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
                  {editingVisit ? 'Actualizar' : 'Crear'} Visita
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
