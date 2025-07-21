import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente admin con service role key para operaciones administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para crear usuario (solo para administradores)
export const createUserAsAdmin = async (userData: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  agency_id: string;
  agency_admin: boolean;
}) => {
  try {
    // Crear usuario en auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        phone: userData.phone
      }
    });

    if (authError) throw authError;

    // Crear perfil en la base de datos
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: userData.full_name,
          phone: userData.phone,
          agency_id: userData.agency_id,
          agency_admin: userData.agency_admin
        }
      ]);

    if (profileError) throw profileError;

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error };
  }
};

// Función para eliminar usuario completamente
export const deleteUserAsAdmin = async (userId: string) => {
  try {
    // Eliminar perfil primero
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Eliminar usuario de auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error };
  }
};

// Función para obtener usuarios con emails (requiere admin)
export const getUsersWithEmails = async (agencyId: string) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
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

    // Obtener emails de auth.users para cada usuario
    const usersWithEmails = await Promise.all(
      profiles.map(async (profile) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: authUser?.user?.email || 'No disponible'
        };
      })
    );

    return { success: true, users: usersWithEmails };
  } catch (error) {
    console.error('Error fetching users with emails:', error);
    return { success: false, error };
  }
};
