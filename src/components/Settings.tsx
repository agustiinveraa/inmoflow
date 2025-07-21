import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';
import { useProfile } from '../hooks/useProfile';

interface SettingsProps {
  user: User;
  onSignOut: () => void;
}

export default function Settings({ user, onSignOut }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { profile, loading: profileLoading, updateProfile } = useProfile(user);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: user.email || '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        phone: profile.phone || ''
      }));
    }
  }, [profile]);

  // Detectar tema actual
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(saved === 'dark' || (!saved && prefersDark));
  }, []);

  // Cambiar tema
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone || undefined
      });
      
      if (success) {
        alert('Perfil actualizado exitosamente');
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email === user.email) {
      alert('El email es el mismo que el actual');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (error) throw error;
      alert('Se ha enviado un email de confirmación a tu nueva dirección');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (formData.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;
      alert('Contraseña actualizada exitosamente');
      setFormData({ ...formData, newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Configuración</h1>
            <p className="text-sm text-black/60 dark:text-white/60">Gestiona tu cuenta y preferencias</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Perfil de Usuario */}
            <div className="xl:col-span-3 space-y-4">
              {/* Información del perfil */}
              <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-lg font-bold">
                    {profileLoading ? (
                      <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-black dark:text-white">Perfil de Usuario</h3>
                    <p className="text-sm text-black/60 dark:text-white/60 truncate">{user.email}</p>
                    {profile?.full_name && (
                      <p className="text-xs text-black/60 dark:text-white/60 truncate">{profile.full_name}</p>
                    )}
                  </div>
                </div>

                {/* Grid de formularios */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Actualizar Información Personal */}
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <h4 className="text-sm font-semibold text-black dark:text-white">Información Personal</h4>
                    <div>
                      <label className="block text-xs font-medium text-black dark:text-white mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full p-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                        disabled={loading || profileLoading}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-black dark:text-white mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                        disabled={loading || profileLoading}
                        placeholder="+34 123 456 789"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || profileLoading}
                      className="w-full px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? 'Actualizando...' : 'Actualizar Perfil'}
                    </button>
                  </form>

                  {/* Actualizar Email */}
                  <form onSubmit={handleUpdateEmail} className="space-y-3">
                    <h4 className="text-sm font-semibold text-black dark:text-white">Email</h4>
                    <div>
                      <label className="block text-xs font-medium text-black dark:text-white mb-1">
                        Dirección de Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || formData.email === user.email}
                      className="w-full px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? 'Actualizando...' : 'Actualizar Email'}
                    </button>
                  </form>
                </div>

                <div className="h-px bg-black/10 dark:bg-white/10 my-4"></div>

                {/* Cambiar Contraseña */}
                <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-black dark:text-white mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full p-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                      disabled={loading}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black dark:text-white mb-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full p-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                      disabled={loading}
                      placeholder="Repite la contraseña"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
                    className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </button>
                </form>
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-4">
              {/* Preferencias */}
              <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Preferencias</h3>
                
                {/* Tema */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
                      {isDark ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-black dark:text-white">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-black dark:text-white">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-black dark:text-white">Tema</h4>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {isDark ? 'Oscuro' : 'Claro'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                      isDark ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-300 ${
                        isDark 
                          ? 'translate-x-5 bg-white dark:bg-black' 
                          : 'translate-x-0.5 bg-black dark:bg-white'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Información de la cuenta */}
              <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Información</h3>
                <div className="space-y-2 text-xs">
                  {profile?.full_name && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Nombre:</span>
                      <span className="text-black dark:text-white truncate ml-2">{profile.full_name}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Teléfono:</span>
                      <span className="text-black dark:text-white">{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-black/60 dark:text-white/60">Email:</span>
                    <span className="text-black dark:text-white truncate ml-2">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60 dark:text-white/60">ID:</span>
                    <span className="text-black dark:text-white font-mono">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60 dark:text-white/60">Creado:</span>
                    <span className="text-black dark:text-white">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cerrar Sesión */}
              <div className="bg-white dark:bg-black border border-red-200 dark:border-red-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Zona de Peligro</h3>
                <p className="text-xs text-black/60 dark:text-white/60 mb-3">
                  Cerrar sesión te desconectará de tu cuenta.
                </p>
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                >
                  <Icons.LogOut />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
