import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';

interface Visit {
  id: string;
  property_id: string;
  client_id: string;
  visit_date: string;
  notes?: string;
  created_at: string;
  property?: { title: string; address: string };
  client?: { full_name: string; phone?: string };
}

interface Property {
  id: string;
  title: string;
  address: string;
}

interface Client {
  id: string;
  full_name: string;
  phone?: string;
}

export default function Visits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [formData, setFormData] = useState({
    property_id: '',
    client_id: '',
    visit_date: '',
    visit_time: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      const [visitsResult, propertiesResult, clientsResult] = await Promise.all([
        supabase
          .from('visits')
          .select(`
            *,
            property:properties(title, address),
            client:clients(full_name, phone)
          `)
          .eq('agency_id', profile.agency_id)
          .order('visit_date', { ascending: true }),
        supabase.from('properties').select('id, title, address').eq('agency_id', profile.agency_id),
        supabase.from('clients').select('id, full_name, phone').eq('agency_id', profile.agency_id)
      ]);

      if (visitsResult.error) throw visitsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setVisits(visitsResult.data || []);
      setProperties(propertiesResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
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

      // Combine date and time into a single timestamp
      const visitDateTime = formData.visit_date + (formData.visit_time ? `T${formData.visit_time}:00` : 'T09:00:00');
      
      const visitData = {
        property_id: formData.property_id,
        client_id: formData.client_id,
        visit_date: visitDateTime,
        notes: formData.notes,
        agency_id: profile.agency_id
      };

      if (selectedVisit) {
        const { error } = await supabase
          .from('visits')
          .update(visitData)
          .eq('id', selectedVisit.id)
          .eq('agency_id', profile.agency_id); // Verificar que pertenece a la agencia
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visits')
          .insert([visitData]);
        if (error) throw error;
      }

      setShowModal(false);
      setSelectedVisit(null);
      setFormData({
        property_id: '',
        client_id: '',
        visit_date: '',
        visit_time: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error saving visit:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to extract time from visit_date string without timezone conversion
  const getTimeFromVisitDate = (visitDateString: string) => {
    // visitDateString format: "2024-07-21T17:23:00" or "2024-07-21T17:23:00.000Z"
    const timePart = visitDateString.split('T')[1];
    if (!timePart) return '00:00';
    
    const timeOnly = timePart.split('.')[0]; // Remove milliseconds if present
    const [hours, minutes] = timeOnly.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const handleDayClick = (date: Date) => {
    const dayVisits = getVisitsForDate(date);
    if (dayVisits.length === 0) {
      // Si no hay visitas, crear una nueva para este día
      createVisitForDate(date);
    } else if (dayVisits.length === 1) {
      // Si hay una sola visita, editarla
      handleEdit(dayVisits[0]);
    } else {
      // Si hay múltiples visitas, mostrar un menú o simplemente crear una nueva
      createVisitForDate(date);
    }
  };

  const createVisitForDate = (date: Date) => {
    // Usar fecha local en lugar de UTC
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setFormData({
      property_id: '',
      client_id: '',
      visit_date: dateStr,
      visit_time: '09:00', // Hora por defecto
      notes: ''
    });
    setSelectedVisit(null);
    setShowModal(true);
  };

  const handleEdit = (visit: Visit) => {
    setSelectedVisit(visit);
    
    // Extraer fecha y hora del string visit_date sin conversión de zona horaria
    const [datePart, timePart] = visit.visit_date.split('T');
    const timeOnly = timePart ? timePart.split('.')[0] : '09:00:00'; // Remove milliseconds if present
    const [hours, minutes] = timeOnly.split(':');
    const timeString = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    setFormData({
      property_id: visit.property_id,
      client_id: visit.client_id,
      visit_date: datePart,
      visit_time: timeString,
      notes: visit.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta visita?')) {
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
          .from('visits')
          .delete()
          .eq('id', id)
          .eq('agency_id', profile.agency_id); // Verificar que pertenece a la agencia
        
        if (error) throw error;
        loadData();
      } catch (error) {
        console.error('Error deleting visit:', error);
      }
    }
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getVisitsForDate = (date: Date) => {
    // Usar fecha local para comparar
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return visits.filter(visit => visit.visit_date.startsWith(dateStr));
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const todayVisits = visits.filter(visit => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    return visit.visit_date.startsWith(todayStr);
  });

  if (loading && !visits.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60 dark:text-white/60">Cargando visitas...</p>
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
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Visitas</h1>
            <p className="text-black/60 dark:text-white/60">Gestiona las visitas a propiedades</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-full p-1 relative overflow-hidden">
              <div 
                className={`absolute top-1 bottom-1 bg-black dark:bg-white rounded-full transition-all duration-300 ease-in-out ${
                  viewMode === 'calendar' ? 'left-1 right-1/2' : 'left-1/2 right-1'
                }`}
              />
              <button
                onClick={() => setViewMode('calendar')}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 z-10 ${
                  viewMode === 'calendar' 
                    ? 'text-white dark:text-black' 
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Calendario
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 z-10 ${
                  viewMode === 'list' 
                    ? 'text-white dark:text-black' 
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Lista
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedVisit(null);
                setFormData({
                  property_id: '',
                  client_id: '',
                  visit_date: '',
                  visit_time: '',
                  notes: ''
                });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-black/80 dark:hover:bg-white/80 transition-all duration-200 hover:scale-105"
            >
              <Icons.Plus className="w-4 h-4" />
              <span>Nueva Visita</span>
            </button>
          </div>
        </div>

        {/* Today's visits summary */}
        {todayVisits.length > 0 && (
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Visitas de Hoy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayVisits.map((visit) => (
                <div key={visit.id} className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Icons.Visits className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black dark:text-white truncate">
                      {Array.isArray(visit.property) ? visit.property[0]?.title : visit.property?.title || 'Propiedad'}
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {Array.isArray(visit.client) ? visit.client[0]?.full_name : visit.client?.full_name || 'Cliente'} - {getTimeFromVisitDate(visit.visit_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black dark:text-white">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-black/60 dark:text-white/60 mr-2">
                  Haz clic en un día para crear una visita
                </div>
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-110 transition-all"
                >
                  <Icons.ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-[1.02] transition-all"
                >
                  Hoy
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-110 transition-all"
                >
                  <Icons.ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-black/60 dark:text-white/60">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getCalendarDays().map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-24 p-1" />;
                }

                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayVisits = getVisitsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div 
                    key={`day-${day}-${index}`} 
                    className={`h-24 p-1 border border-black/10 dark:border-white/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => handleDayClick(date)}
                    title={dayVisits.length === 0 ? "Haz clic para crear una nueva visita" : `${dayVisits.length} visita${dayVisits.length > 1 ? 's' : ''} programada${dayVisits.length > 1 ? 's' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-black dark:text-white'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayVisits.length === 0 && (
                        <div className="flex items-center justify-center h-6 opacity-0 group-hover:opacity-30 transition-opacity">
                          <Icons.Plus className="w-3 h-3 text-black dark:text-white" />
                        </div>
                      )}
                      {dayVisits.slice(0, 2).map((visit) => (
                        <div
                          key={visit.id}
                          className="text-xs p-1 rounded truncate cursor-pointer bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevenir que se active el click del día
                            handleEdit(visit);
                          }}
                          title={`Editar: ${Array.isArray(visit.client) ? visit.client[0]?.full_name : visit.client?.full_name || 'Cliente'} - ${Array.isArray(visit.property) ? visit.property[0]?.title : visit.property?.title || 'Propiedad'}`}
                        >
                          {getTimeFromVisitDate(visit.visit_date)}
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <div 
                          className="text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            createVisitForDate(date);
                          }}
                          title="Crear nueva visita para este día"
                        >
                          +{dayVisits.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-black/60 dark:text-white/60">
                {visits.length} visitas
              </div>
            </div>

            {/* Visits List */}
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/5 dark:bg-white/5">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Fecha & Hora</th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Propiedad</th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white text-sm">Cliente</th>
                      <th className="text-right py-3 px-4 font-semibold text-black dark:text-white text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((visit) => (
                      <tr key={visit.id} className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-black dark:text-white">
                              {new Date(visit.visit_date).toLocaleDateString('es-ES')}
                            </div>
                            <div className="text-xs text-black/60 dark:text-white/60">
                              {getTimeFromVisitDate(visit.visit_date)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-black dark:text-white">
                              {Array.isArray(visit.property) ? visit.property[0]?.title : visit.property?.title || 'Propiedad'}
                            </div>
                            <div className="text-xs text-black/60 dark:text-white/60">
                              {Array.isArray(visit.property) ? visit.property[0]?.address : visit.property?.address || 'Dirección'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-black dark:text-white">
                              {Array.isArray(visit.client) ? visit.client[0]?.full_name : visit.client?.full_name || 'Cliente'}
                            </div>
                            {((Array.isArray(visit.client) ? visit.client[0]?.phone : visit.client?.phone) && (
                              <div className="text-xs text-black/60 dark:text-white/60">
                                {Array.isArray(visit.client) ? visit.client[0]?.phone : visit.client?.phone}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(visit)}
                              className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-110 transition-all"
                            >
                              <Icons.Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(visit.id)}
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

              {visits.length === 0 && (
                <div className="text-center py-12">
                  <Icons.Visits className="w-16 h-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">No hay visitas</h3>
                  <p className="text-black/60 dark:text-white/60 mb-4">
                    Comienza programando tu primera visita
                  </p>
                  <button
                    onClick={() => {
                      setSelectedVisit(null);
                      setFormData({
                        property_id: '',
                        client_id: '',
                        visit_date: '',
                        visit_time: '',
                        notes: ''
                      });
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-black/80 dark:hover:bg-white/80 hover:scale-[1.02] transition-all mx-auto"
                  >
                    <Icons.Plus className="w-4 h-4" />
                    <span>Nueva Visita</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {selectedVisit ? 'Editar Visita' : 'Nueva Visita'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedVisit(null);
                    setFormData({
                      property_id: '',
                      client_id: '',
                      visit_date: '',
                      visit_time: '',
                      notes: ''
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
                      Propiedad *
                    </label>
                    <select
                      required
                      value={formData.property_id}
                      onChange={(e) => updateFormField('property_id', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    >
                      <option value="">Seleccionar propiedad</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.title} - {property.address}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Cliente *
                    </label>
                    <select
                      required
                      value={formData.client_id}
                      onChange={(e) => updateFormField('client_id', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    >
                      <option value="">Seleccionar cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.full_name} {client.phone && `- ${client.phone}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.visit_date || ''}
                      onChange={(e) => updateFormField('visit_date', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={formData.visit_time || ''}
                      onChange={(e) => updateFormField('visit_time', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Notas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => updateFormField('notes', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none"
                    placeholder="Información adicional sobre la visita..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedVisit(null);
                      setFormData({
                        property_id: '',
                        client_id: '',
                        visit_date: '',
                        visit_time: '',
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
                    <span>{selectedVisit ? 'Actualizar' : 'Crear'}</span>
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
