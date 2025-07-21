import { ReactNode, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Icons } from './Icons';
import { useProfile } from '../hooks/useProfile';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onSignOut: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, user, currentPage, onPageChange }: LayoutProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { profile, loading: profileLoading } = useProfile(user);
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'properties', label: 'Propiedades', icon: Icons.Properties },
    { id: 'clients', label: 'Clientes', icon: Icons.Clients },
    { id: 'visits', label: 'Visitas', icon: Icons.Visits },
    { id: 'settings', label: 'Ajustes', icon: Icons.Settings },
  ];

  return (
    <div className="flex min-h-screen animated-bg">
      {/* Sidebar */}
      <div className="w-64 app-sidebar flex flex-col relative py-4">
        {/* Header */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              {/* User Profile Image */}
            <div className="relative">
              <button
                onClick={() => onPageChange('settings')}
                className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold hover:scale-110 transition-all duration-300 hover:shadow-lg"
                title={profile?.full_name || user.email || 'Usuario'}
              >
                {profileLoading ? (
                  <div className="w-3 h-3 border border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                )}
              </button>
            </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-medium text-sm text-black dark:text-white truncate">InmoFlow</h1>
                {profile && !profileLoading && (
                  <p className="text-xs text-black/60 dark:text-white/60 truncate">
                    {profile.full_name}
                  </p>
                )}
              </div>
            </div>
            
            
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="app-sidebar-nav flex-1 space-y-1 px-4 mt-4">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`app-sidebar-item w-full text-left ${currentPage === item.id ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-6 h-6">
                  <IconComponent />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Feedback Section */}
        <div className="px-4 mt-auto mb-2">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className={`app-sidebar-item w-full text-left ${currentPage === 'feedback' ? 'active' : ''} relative`}
          >
            <div className="w-6 h-6 relative">
              <Icons.Feedback />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                !
              </span>
            </div>
            <span className="text-sm font-medium">Hacer feedback</span>
          </button>
        </div>
      </div>

      {/* Feedback Popup */}
      {isFeedbackOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={() => setIsFeedbackOpen(false)}
          ></div>
          
          {/* Popup */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="p-6 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-black dark:text-white">Enviar Feedback</h2>
                  <button
                    onClick={() => setIsFeedbackOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
                  >
                    <span className="text-black/60 dark:text-white/60 text-xl">×</span>
                  </button>
                </div>
                <p className="text-sm text-black/60 dark:text-white/60 mt-2">
                  Comparte tus comentarios y sugerencias para mejorar InmoFlow
                </p>
              </div>
              
              {/* Form */}
              <div className="p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Tipo de feedback
                    </label>
                    <select className="w-full p-3 border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20">
                      <option>Sugerencia</option>
                      <option>Problema</option>
                      <option>Mejora</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Tu mensaje
                    </label>
                    <textarea 
                      rows={4}
                      placeholder="Describe tu feedback aquí..."
                      className="w-full p-3 border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 resize-none"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Email (opcional)
                    </label>
                    <input 
                      type="email"
                      placeholder="tu@email.com"
                      defaultValue={user.email}
                      className="w-full p-3 border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(false)}
                      className="flex-1 px-4 py-3 border border-black/10 dark:border-white/10 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-all duration-200 font-medium"
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
