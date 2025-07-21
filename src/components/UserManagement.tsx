import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserAgencyId, isAgencyAdmin } from '../lib/agencyHelpers';
import { Icons } from './Icons';
import { useEntranceAnimation, useModalAnimation, useStaggerAnimation, useButtonAnimation, useFormAnimation } from '../hooks/useGSAP';

interface User {
  id: string;
  full_name: string;
  phone?: string;
  created_at: string;
  agency_admin: boolean;
  email?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // GSAP Animation hooks
  const pageRef = useEntranceAnimation();
  const usersListRef = useStaggerAnimation([users.length]);
  const createUserButtonRef = useButtonAnimation();
  const formRef = useFormAnimation();
  
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

      // Sin admin API, no podemos obtener los emails de auth.users
      // En su lugar, mostramos los perfiles sin email
      const usersWithoutEmails = profiles.map(profile => ({
        ...profile,
        email: 'Email no disponible (requiere admin API)'
      }));

      setUsers(usersWithoutEmails);
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

    setSubmitting(true);
    try {
      // NOTA: Esta funcionalidad requiere configurar el service role key de Supabase
      alert('⚠️ Funcionalidad deshabilitada:\n\nPara crear usuarios necesitas:\n1. Configurar SUPABASE_SERVICE_ROLE_KEY\n2. Crear un cliente admin separado\n\nVer documentación en MULTI_TENANT_SETUP.md');
      
      // Limpiar formulario sin crear usuario
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setIsAdminUser(false);
      setShowCreateForm(false);
      
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
      // Solo eliminar perfil (requiere admin API para eliminar de auth)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      alert('Perfil eliminado. NOTA: Para eliminar completamente el usuario se requiere admin API de Supabase.');
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
            <p className="text-black/60 dark:text-white/60">Administra los usuarios de tu agencia</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-black/80 dark:hover:bg-white/80 hover:scale-[1.02] transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-black/10 dark:border-white/10 rounded-full bg-white dark:bg-black text-black dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-black/10 dark:border-white/10 rounded-full bg-white dark:bg-black text-black dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border border-black/10 dark:border-white/10 rounded-full bg-white dark:bg-black text-black dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-black/10 dark:border-white/10 rounded-full bg-white dark:bg-black text-black dark:text-white"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isAdminUser}
                    onChange={(e) => setIsAdminUser(e.target.checked)}
                    className="rounded border-black/10 dark:border-white/10"
                  />
                  <span className="text-sm text-black dark:text-white">Administrador de agencia</span>
                </label>
              </div>
              
              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-black/10 dark:border-white/10 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 hover:scale-[1.02] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-black/80 dark:hover:bg-white/80 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Teléfono</th>
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Rol</th>
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Fecha de Registro</th>
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                          <Icons.User className="w-4 h-4 text-black dark:text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">{user.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-black/60 dark:text-white/60">{user.email}</td>
                    <td className="p-4 text-black/60 dark:text-white/60">{user.phone || 'No disponible'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.agency_admin 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400'
                      }`}>
                        {user.agency_admin ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="p-4 text-black/60 dark:text-white/60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleUserAdmin(user.id, user.agency_admin)}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:scale-110 transition-all"
                          title={user.agency_admin ? 'Quitar admin' : 'Hacer admin'}
                        >
                          <Icons.User className="w-4 h-4 text-black/60 dark:text-white/60" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full hover:scale-110 transition-all"
                          title="Eliminar usuario"
                        >
                          <Icons.Trash className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <Icons.User className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-3" />
              <p className="text-black/60 dark:text-white/60">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
