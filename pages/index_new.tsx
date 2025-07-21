import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import Layout from '../src/components/Layout';
import Dashboard from '../src/components/Dashboard';
import Properties from '../src/components/Properties';
import Clients from '../src/components/Clients';
import Visits from '../src/components/Visits';
import Settings from '../src/components/Settings';
import UserManagement from '../src/components/UserManagement';
import ThemeToggle from '../src/components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!email || !password) {
      alert('Introduce email y contraseña');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="loading-dots text-black dark:text-white mx-auto">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-center text-black dark:text-white mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const renderCurrentPage = () => {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'properties':
          return <Properties />;
        case 'clients':
          return <Clients />;
        case 'visits':
          return <Visits />;
        case 'users':
          return <UserManagement />;
        case 'settings':
          return <Settings user={user} onSignOut={signOut} />;
        default:
          return <Dashboard />;
      }
    };

    return (
      <Layout
        user={user}
        onSignOut={signOut}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      >
        {renderCurrentPage()}
      </Layout>
    );
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
            Bienvenido
          </h1>
          <p className="text-lg text-black/60 dark:text-white/60">
            Accede a tu CRM inmobiliario
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-8 shadow-lg space-y-6 animate-slideInUp">
          {/* Header - Solo Login */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-black/5 dark:bg-white/5 rounded-lg">
              <span className="text-black dark:text-white font-semibold">Acceso Autorizado</span>
            </div>
            <p className="text-black/60 dark:text-white/60 text-sm mt-2">
              Solo usuarios registrados por un administrador
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-black/20 dark:focus:ring-white/20" />
              <span className="text-black/60 dark:text-white/60">Recordarme</span>
            </label>
            <button className="text-black/80 hover:text-black dark:text-white/80 dark:hover:text-white font-medium transition-colors duration-200">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          <button 
            onClick={signIn}
            className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg transition-all duration-300 hover:bg-black/80 dark:hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
          >
            Iniciar sesión
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-black/60 dark:text-white/60 animate-fadeInUp delay-200">
          <p className="text-sm">
            © 2025 CRM Inmobiliario. Sistema profesional de gestión inmobiliaria.
          </p>
        </div>
      </div>
    </div>
  );
}
