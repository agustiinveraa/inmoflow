import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserAgencyId, isAgencyAdmin } from '../lib/agencyHelpers';
import { Icons } from './Icons';

// Importar funciones admin solo si la clave está configurada
const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
let adminFunctions: any = null;

if (hasServiceRoleKey) {
  adminFunctions = require('../lib/supabaseAdmin');
}

interface User {
  id: string;
  full_name: string;
  phone?: string;
  created_at: string;
  agency_admin: boolean;
  email?: string;
}

export default function UserManagementWithAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checkAdminAndLoadUsers = useCallback(async () => {
    try {
      const adminStatus = await isAgencyAdmin();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, [checkAdminAndLoadUsers]);

  const loadUsers = async () => {
    try {
      const agencyId = await getUserAgencyId();
      
      if (hasServiceRoleKey && adminFunctions) {
        // Usar admin API para obtener emails
        const result = await adminFunctions.getUsersWithEmails(agencyId);
        if (result.success) {
          setUsers(result.users);
        } else {
          throw result.error;
        }
      } else {
        // Fallback sin admin API
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            phone,
            created_at,
            agency_admin
          `)
          .eq('agency_id', agencyId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const usersWithoutEmails = profiles.map(profile => ({
          ...profile,
          email: 'Configurar service role key para ver emails'
        }));

        setUsers(usersWithoutEmails);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      alert('Todos los campos son obligatorios');
      return;
    }

    if (!hasServiceRoleKey || !adminFunctions) {
      alert('⚠️ Service Role Key no configurado.\n\nVer MULTI_TENANT_SETUP.md para instrucciones.');
      return;
    }

    setSubmitting(true);
    try {
      const agencyId = await getUserAgencyId();

      const result = await adminFunctions.createUserAsAdmin({
        email,
        password,
        full_name: fullName,
        phone,
        agency_id: agencyId,
        agency_admin: isAdminUser
      });

      if (result.success) {
        alert('Usuario creado exitosamente');
        
        // Limpiar formulario
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
        setIsAdminUser(false);
        setShowCreateForm(false);
        
        // Recargar lista de usuarios
        await loadUsers();
      } else {
        throw result.error;
      }
      
    } catch (error: unknown) {
      console.error('Error creando usuario:', error);
      alert('Error al crear usuario: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ agency_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert('Error al actualizar usuario');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

    try {
      if (hasServiceRoleKey && adminFunctions) {
        // Usar admin API para eliminación completa
        const result = await adminFunctions.deleteUserAsAdmin(userId);
        if (result.success) {
          alert('Usuario eliminado completamente');
        } else {
          throw result.error;
        }
      } else {
        // Solo eliminar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) throw profileError;
        alert('Perfil eliminado (auth user permanece - configurar service role key)');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60 dark:text-white/60">Cargando gestión de usuarios...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Icons.Lock className="w-16 h-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Acceso Restringido</h2>
          <p className="text-black/60 dark:text-white/60">Solo los administradores de agencia pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Gestión de Usuarios</h1>
            <div className="flex items-center space-x-2">
              <p className="text-black/60 dark:text-white/60">Administra los usuarios de tu agencia</p>
              {!hasServiceRoleKey && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">
                  Funcionalidad limitada
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!hasServiceRoleKey}
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>

        {!hasServiceRoleKey && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Icons.Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                  Service Role Key no configurado
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  Para crear usuarios y ver emails, configura el service role key. Ver <code>MULTI_TENANT_SETUP.md</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resto del componente igual... */}
        {/* Aquí iría el resto del JSX del formulario y tabla */}
      </div>
    </div>
  );
}
