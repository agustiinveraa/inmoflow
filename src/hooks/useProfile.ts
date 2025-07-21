import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types';

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No existe el perfil, intentar crearlo
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                  phone: user.user_metadata?.phone || null
                }
              ])
              .select()
              .single();

            if (createError) {
              throw createError;
            }
            
            setProfile(newProfile);
          } else {
            throw error;
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'phone'>>) => {
    if (!user || !profile) return false;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile
  };
}
