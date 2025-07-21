import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';

interface Property {
  id: string;
  title: string;
  description?: string;
  address?: string;
  price?: number;
  property_type: string;
  status: string;
  client_id?: string;
  images?: string[];
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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
    client_id: '',
    images: [] as string[]
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const loadProperties = async () => {
    try {
      const [propertiesResult, clientsResult] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, full_name, email, phone')
          .order('full_name', { ascending: true })
      ]);

      if (propertiesResult.error) throw propertiesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setProperties(propertiesResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      // Subir nuevas imágenes si hay archivos seleccionados
      let imageUrls = [...formData.images];
      if (uploadedFiles.length > 0) {
        const newImageUrls = await uploadImages(uploadedFiles);
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      const propertyData = {
        title: formData.title,
        description: formData.description || null,
        address: formData.address || null,
        price: parseFloat(formData.price) || null,
        property_type: formData.property_type,
        status: formData.status,
        client_id: formData.client_id || null,
        images: imageUrls
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
        client_id: '',
        images: []
      });
      setUploadedFiles([]);
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title,
      description: property.description || '',
      address: property.address || '',
      price: property.price?.toString() || '',
      property_type: property.property_type,
      status: property.status,
      client_id: property.client_id || '',
      images: property.images || []
    });
    setUploadedFiles([]);
    setShowModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
                         (property.address && property.address.toLowerCase().includes(searchTerm.toLowerCase()));
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
            <div key={property.id} className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="h-48 bg-gray-100 dark:bg-gray-800 relative">
                {property.images && property.images.length > 0 ? (
                  <Image 
                    src={property.images[0]} 
                    alt={property.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icons.Properties className="w-12 h-12 text-black/20 dark:text-white/20" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{property.title}</h3>
                    <p className="text-sm text-black/60 dark:text-white/60">{property.address || 'Sin dirección'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                    {getStatusText(property.status)}
                  </span>
                </div>

                <p className="text-sm text-black/70 dark:text-white/70 mb-3 line-clamp-2">{property.description || 'Sin descripción'}</p>

                <div className="flex items-center space-x-3 mb-3 text-sm">
                  <div className="flex items-center space-x-1">
                    <Icons.Properties className="w-4 h-4 text-black/60 dark:text-white/60" />
                    <span className="text-black/60 dark:text-white/60">{property.property_type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-black dark:text-white">
                    €{property.price ? property.price.toLocaleString() : '0'}
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
                      client_id: '',
                      images: []
                    });
                    setUploadedFiles([]);
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
                      <option value="piso">Piso</option>
                      <option value="casa">Casa</option>
                      <option value="chalet">Chalet</option>
                      <option value="ático">Ático</option>
                      <option value="local">Local Comercial</option>
                      <option value="oficina">Oficina</option>
                      <option value="terreno">Terreno</option>
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

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Cliente Propietario
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                  >
                    <option value="">Sin propietario asignado</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.full_name} {client.email && `(${client.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Imágenes de la propiedad
                  </label>
                  
                  {/* Subir nuevas imágenes */}
                  <div className="mb-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Selecciona múltiples imágenes (JPG, PNG, WebP)
                    </p>
                  </div>

                  {/* Vista previa de archivos nuevos */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-black dark:text-white mb-2">
                        Nuevas imágenes ({uploadedFiles.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Nueva imagen ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeUploadedFile(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Imágenes existentes */}
                  {formData.images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-black dark:text-white mb-2">
                        Imágenes actuales ({formData.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {formData.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={imageUrl}
                              alt={`Imagen ${index + 1}`}
                              width={100}
                              height={80}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        client_id: '',
                        images: []
                      });
                      setUploadedFiles([]);
                    }}
                    className="px-4 py-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors disabled:opacity-50"
                  >
                    {(loading || uploading) && <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>}
                    <span>{uploading ? 'Subiendo...' : selectedProperty ? 'Actualizar' : 'Crear'}</span>
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
