import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  property_type: string;
  status: 'available' | 'sold' | 'rented';
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  created_at: string;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    price: '',
    property_type: '',
    status: 'available',
    bedrooms: '',
    bathrooms: '',
    size: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseInt(formData.bathrooms) || null,
        size: parseFloat(formData.size) || null
      };

      if (selectedProperty) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', selectedProperty.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([propertyData]);
        if (error) throw error;
      }

      setShowModal(false);
      setSelectedProperty(null);
      setFormData({
        title: '',
        description: '',
        address: '',
        price: '',
        property_type: '',
        status: 'available',
        bedrooms: '',
        bathrooms: '',
        size: ''
      });
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      address: property.address,
      price: property.price.toString(),
      property_type: property.property_type,
      status: property.status,
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      size: property.size?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      try {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        loadProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'sold': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'rented': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'sold': return 'Vendida';
      case 'rented': return 'Alquilada';
      default: return status;
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesType = filterType === 'all' || property.property_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const propertyTypes = [...new Set(properties.map(p => p.property_type))];

  if (loading && !properties.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60 dark:text-white/60">Cargando propiedades...</p>
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
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Propiedades</h1>
            <p className="text-black/60 dark:text-white/60">Gestiona tu cartera inmobiliaria</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Nueva Propiedad</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Buscar propiedades..."
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
            <option value="available">Disponible</option>
            <option value="sold">Vendida</option>
            <option value="rented">Alquilada</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
          >
            <option value="all">Todos los tipos</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="text-sm text-black/60 dark:text-white/60 flex items-center">
            {filteredProperties.length} de {properties.length} propiedades
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{property.title}</h3>
                  <p className="text-sm text-black/60 dark:text-white/60">{property.address}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                  {getStatusText(property.status)}
                </span>
              </div>

              <p className="text-sm text-black/70 dark:text-white/70 mb-3 line-clamp-2">{property.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="flex items-center space-x-1">
                  <Icons.Properties className="w-4 h-4 text-black/60 dark:text-white/60" />
                  <span className="text-black/60 dark:text-white/60">{property.property_type}</span>
                </div>
                {property.bedrooms && (
                  <div className="flex items-center space-x-1">
                    <Icons.Home className="w-4 h-4 text-black/60 dark:text-white/60" />
                    <span className="text-black/60 dark:text-white/60">{property.bedrooms} hab.</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center space-x-1">
                    <Icons.MapPin className="w-4 h-4 text-black/60 dark:text-white/60" />
                    <span className="text-black/60 dark:text-white/60">{property.bathrooms} baños</span>
                  </div>
                )}
                {property.size && (
                  <div className="flex items-center space-x-1">
                    <Icons.Square className="w-4 h-4 text-black/60 dark:text-white/60" />
                    <span className="text-black/60 dark:text-white/60">{property.size} m²</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-black dark:text-white">
                  €{property.price.toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(property)}
                    className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Icons.Delete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <Icons.Properties className="w-16 h-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">No hay propiedades</h3>
            <p className="text-black/60 dark:text-white/60 mb-4">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                ? 'No se encontraron propiedades con los filtros aplicados' 
                : 'Comienza agregando tu primera propiedad'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors mx-auto"
            >
              <Icons.Plus className="w-4 h-4" />
              <span>Nueva Propiedad</span>
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {selectedProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProperty(null);
                    setFormData({
                      title: '',
                      description: '',
                      address: '',
                      price: '',
                      property_type: '',
                      status: 'available',
                      bedrooms: '',
                      bathrooms: '',
                      size: ''
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
                      Título *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Precio (€) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Tipo de Propiedad *
                    </label>
                    <select
                      required
                      value={formData.property_type}
                      onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Chalet">Chalet</option>
                      <option value="Ático">Ático</option>
                      <option value="Local Comercial">Local Comercial</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Terreno">Terreno</option>
                    </select>
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
                      <option value="available">Disponible</option>
                      <option value="sold">Vendida</option>
                      <option value="rented">Alquilada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Habitaciones
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Baños
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Tamaño (m²)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedProperty(null);
                      setFormData({
                        title: '',
                        description: '',
                        address: '',
                        price: '',
                        property_type: '',
                        status: 'available',
                        bedrooms: '',
                        bathrooms: '',
                        size: ''
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
                    <span>{selectedProperty ? 'Actualizar' : 'Crear'}</span>
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
