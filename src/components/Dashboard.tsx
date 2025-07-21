import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserAgencyId } from '../lib/agencyHelpers';
import { Icons } from './Icons';

interface DashboardStats {
  activeProperties: number;
  totalClients: number;
  todayVisits: number;
  totalVisits: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'property' | 'client' | 'visit';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProperties: 0,
    totalClients: 0,
    todayVisits: 0,
    totalVisits: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Obtener la agencia del usuario autenticado
      const agencyId = await getUserAgencyId();

      // Obtener estadísticas en paralelo filtradas por agencia
      const [propertiesResult, clientsResult, visitsResult, todayVisitsResult] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact' }).eq('agency_id', agencyId),
        supabase.from('clients').select('*', { count: 'exact' }).eq('agency_id', agencyId),
        supabase.from('visits').select('*', { count: 'exact' }).eq('agency_id', agencyId),
        supabase.from('visits').select('*', { count: 'exact' })
          .eq('agency_id', agencyId)
          .gte('visit_date', new Date().toISOString().split('T')[0])
      ]);

      // Obtener actividad reciente filtrada por agencia
      const { data: recentProperties } = await supabase
        .from('properties')
        .select('id, title, created_at, status')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentClients } = await supabase
        .from('clients')
        .select('id, full_name, created_at')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentVisits } = await supabase
        .from('visits')
        .select('id, visit_date, created_at')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Crear array de actividad reciente
      const activity: Activity[] = [
        ...(recentProperties?.map(p => ({
          id: p.id,
          type: 'property' as const,
          title: p.title,
          description: `Propiedad ${p.status === 'available' ? 'disponible' : p.status}`,
          timestamp: p.created_at,
          status: p.status
        })) || []),
        ...(recentClients?.map(c => ({
          id: c.id,
          type: 'client' as const,
          title: c.full_name,
          description: 'Nuevo cliente registrado',
          timestamp: c.created_at
        })) || []),
        ...(recentVisits?.map(v => ({
          id: v.id,
          type: 'visit' as const,
          title: `Visita programada`,
          description: `Fecha: ${new Date(v.visit_date).toLocaleDateString()}`,
          timestamp: v.created_at || v.visit_date
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

      setStats({
        activeProperties: propertiesResult.count || 0,
        totalClients: clientsResult.count || 0,
        todayVisits: todayVisitsResult.count || 0,
        totalVisits: visitsResult.count || 0,
        recentActivity: activity
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property': return Icons.Properties;
      case 'client': return Icons.Clients;
      case 'visit': return Icons.Visits;
      default: return Icons.Dashboard;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'client': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'visit': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60 dark:text-white/60">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Dashboard</h1>
          <p className="text-black/60 dark:text-white/60">Resumen de tu actividad inmobiliaria</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Propiedades Activas */}
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Icons.Properties className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-black/60 dark:text-white/60">Activas</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-black dark:text-white">{stats.activeProperties}</h3>
              <p className="text-sm text-black/60 dark:text-white/60">Propiedades</p>
            </div>
          </div>

          {/* Total Clientes */}
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Icons.Clients className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-black/60 dark:text-white/60">Total</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-black dark:text-white">{stats.totalClients}</h3>
              <p className="text-sm text-black/60 dark:text-white/60">Clientes</p>
            </div>
          </div>

          {/* Visitas Hoy */}
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Icons.Visits className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-black/60 dark:text-white/60">Hoy</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-black dark:text-white">{stats.todayVisits}</h3>
              <p className="text-sm text-black/60 dark:text-white/60">Visitas</p>
            </div>
          </div>

          {/* Total Visitas */}
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <Icons.Stats className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs text-black/60 dark:text-white/60">Total</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-black dark:text-white">{stats.totalVisits}</h3>
              <p className="text-sm text-black/60 dark:text-white/60">Visitas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
          {/* Actividad Reciente */} 
          <div className="lg:col-span-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">Actividad Reciente</h2>
              <button className="text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white px-3 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200">
                Ver todo
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-black dark:text-white truncate">{activity.title}</h4>
                        <p className="text-xs text-black/60 dark:text-white/60 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-black/60 dark:text-white/60">
                        {new Date(activity.timestamp).toLocaleDateString() /* TODO: PONER TAMBIEN LA HORA*/} 
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Icons.Dashboard className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-black/60 dark:text-white/60">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-4">
            {/* Acciones Rápidas */}
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 text-left hover:scale-[1.02]">
                  <Icons.Plus className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-sm text-black dark:text-white">Nueva Propiedad</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 text-left hover:scale-[1.02]">
                  <Icons.User className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-sm text-black dark:text-white">Nuevo Cliente</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 text-left hover:scale-[1.02]">
                  <Icons.Visits className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-sm text-black dark:text-white">Programar Visita</span>
                </button>
              </div>
            </div>

            {/* Estado del Sistema */}
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/60 dark:text-white/60">Base de Datos</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Activa</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/60 dark:text-white/60">Sincronización</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Sincronizado</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/60 dark:text-white/60">Última actualización</span>
                  <span className="text-xs text-black/60 dark:text-white/60">Hace 2 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
