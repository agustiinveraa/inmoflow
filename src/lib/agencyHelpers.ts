import { supabase } from './supabaseClient';

/**
 * Obtiene la agencia del usuario autenticado
 * @returns Promise<string> - El ID de la agencia
 * @throws Error si el usuario no está autenticado o no tiene agencia
 */
export const getUserAgencyId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error('Usuario sin agencia asignada');

  return profile.agency_id;
};

/**
 * Verifica si un recurso pertenece a la agencia del usuario
 * @param tableName - Nombre de la tabla
 * @param resourceId - ID del recurso
 * @returns Promise<boolean> - true si el recurso pertenece a la agencia
 */
export const verifyResourceOwnership = async (
  tableName: string, 
  resourceId: string
): Promise<boolean> => {
  try {
    const agencyId = await getUserAgencyId();
    
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id', resourceId)
      .eq('agency_id', agencyId);

    return (count || 0) > 0;
  } catch {
    return false;
  }
};

/**
 * Verifica si el usuario autenticado es administrador de su agencia
 * @returns Promise<boolean> - true si es administrador
 */
export const isAgencyAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_admin')
      .eq('id', user.id)
      .single();

    return profile?.agency_admin || false;
  } catch {
    return false;
  }
};

/**
 * Obtiene información completa del usuario incluyendo datos de agencia
 * @returns Promise<Object> - Información del usuario y agencia
 */
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      agencies (
        id,
        name
      )
    `)
    .eq('id', user.id)
    .single();

  return { user, profile };
};
