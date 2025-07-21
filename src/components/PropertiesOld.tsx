import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Property } from '../types/database';
import ImageUpload from './ImageUpload';

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    status: 'available' as 'available' | 'sold' | 'rented' | 'reserved',
    property_type: 'piso',
    images: [] as string[]
  });

  const loadProperties = useCallback(async () => {
    try {
      let query = supabase.from('properties').select('*');
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const propertyData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        images: formData.images.length > 0 ? formData.images : null
      };

      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([propertyData]);
        
        if (error) throw error;
      }

      setShowForm(false);
      setEditingProperty(null);
      setFormData({
        title: '',
        description: '',
        price: '',
        address: '',
        status: 'available',
        property_type: 'piso',
        images: []
      });
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error al guardar la propiedad');
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description || '',
      price: property.price?.toString() || '',
      address: property.address || '',
      status: property.status,
      property_type: property.property_type || 'piso',
      images: property.images || []
    });
    setShowForm(true);
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      if (error) throw error;
      loadProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#111827';
      case 'reserved': return '#374151';
      case 'sold': return '#6b7280';
      case 'rented': return '#9ca3af';
      default: return '#d1d5db';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'reserved': return 'Reservada';
      case 'sold': return 'Vendida';
      case 'rented': return 'Alquilada';
      default: return status;
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando propiedades...</div>;
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
          <h1 style={{ margin: 0, color: '#111827' }}>Propiedades</h1>
          <p style={{ color: '#6b7280', marginTop: 5 }}>
            Gestiona tu cartera de propiedades
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProperty(null);
            setFormData({
              title: '',
              description: '',
              price: '',
              address: '',
              status: 'available',
              property_type: 'piso',
              images: []
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
          Nueva Propiedad
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 20,
        display: 'flex',
        gap: 15,
        flexWrap: 'wrap'
      }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="reserved">Reservada</option>
          <option value="sold">Vendida</option>
          <option value="rented">Alquilada</option>
        </select>
        
        <button
          onClick={loadProperties}
          style={{
            padding: '8px 16px',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Aplicar Filtros
        </button>
      </div>

      {/* Lista de propiedades */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 20
      }}>
        {properties.map((property) => (
          <div
            key={property.id}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              height: 150,
              backgroundColor: '#ecf0f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {property.images && property.images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {property.images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      +{property.images.length - 1} más
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  color: '#9ca3af',
                  fontSize: '48px'
                }}>
                  ⌂
                </div>
              )}
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 10
              }}>
                <h3 style={{ margin: 0, color: '#111827' }}>
                  {property.title}
                </h3>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: getStatusColor(property.status),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getStatusText(property.status)}
                </span>
              </div>

              {property.price && (
                <p style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  €{property.price.toLocaleString()}
                </p>
              )}

              {property.address && (
                <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                  {property.address}
                </p>
              )}

              {property.description && (
                <p style={{
                  color: '#6b7280',
                  margin: '0 0 15px 0',
                  fontSize: '14px',
                  lineHeight: 1.4
                }}>
                  {property.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEdit(property)}
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
                  onClick={() => handleDelete(property.id)}
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
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
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
          }}>⌂</div>
          <h3 style={{ color: '#6b7280' }}>No hay propiedades aún</h3>
          <p style={{ color: '#9ca3af' }}>Comienza agregando tu primera propiedad</p>
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
              {editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                  Tipo
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({...formData, property_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="piso">Piso</option>
                  <option value="casa">Casa</option>
                  <option value="local">Local</option>
                  <option value="oficina">Oficina</option>
                </select>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                  Precio (€)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'available' | 'sold' | 'rented' | 'reserved'})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Reservada</option>
                  <option value="sold">Vendida</option>
                  <option value="rented">Alquilada</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData({...formData, images})}
                maxImages={5}
              />

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
                  {editingProperty ? 'Actualizar' : 'Crear'} Propiedad
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
