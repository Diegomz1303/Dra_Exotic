'use server'

import { createInsForgeServerClient, setAuthCookies, clearAuthCookies } from '@/lib/insforge-server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signIn(formData: FormData) {
  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? '')
  })

  // Traducir mensajes comunes de error
  let errorMessage = error?.message;
  if (error?.message === "Invalid login credentials") {
    errorMessage = "Correo o contraseña incorrectos.";
  }

  if (error || !data?.accessToken || !data?.refreshToken) {
    return { success: false, error: errorMessage ?? 'Error al iniciar sesión.' }
  }

  await setAuthCookies(data.accessToken, data.refreshToken)
  return { success: true }
}

export async function signOut() {
  await clearAuthCookies()
  redirect('/')
}

export async function getUserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return null;
  
  try {
    const insforge = createInsForgeServerClient(token);
    // Usamos 'as any' porque el linter puede no tener la definición más reciente, 
    // pero la skill confirma que es el método correcto.
    const { data, error } = await (insforge.auth as any).getCurrentSession();
    
    if (error) {
      console.warn("getUserProfile SDK error:", error.message);
      return null;
    }
    
    return data?.session?.user ?? data?.user ?? null;
  } catch (error) {
    console.error("getUserProfile fatal error:", error);
    return null;
  }
}

export async function updateProfileInfo(nombre_clinica: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return { error: "No autenticado" };
  
  try {
    const insforge = createInsForgeServerClient(token);
    const { data, error } = await (insforge.auth as any).setProfile({
      nombre_clinica
    });
    
    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    return { error: "Error de conexión" };
  }
}

export async function updateUserPassword(password: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return { error: "No autenticado" };
  
  try {
    const insforge = createInsForgeServerClient(token);
    const { error } = await (insforge.auth as any).updateUser({ password });
    
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar contraseña" };
  }
}
