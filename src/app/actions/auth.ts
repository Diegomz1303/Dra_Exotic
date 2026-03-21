'use server'

import { createInsForgeServerClient, setAuthCookies, clearAuthCookies } from '@/servicios/insforge-server'
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
  const token = cookieStore.get("sb-access-token")?.value;
  if (!token) return null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY as string }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function updateProfileInfo(nombre_clinica: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  if (!token) return { error: "No autenticado" };
  const res = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY as string, "Content-Type": "application/json" },
    body: JSON.stringify({ data: { nombre_clinica } })
  });
  if (!res.ok) return { error: "Error al actualizar" };
  return { success: true };
}

export async function updateUserPassword(password: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  if (!token) return { error: "No autenticado" };
  const res = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY as string, "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  if (!res.ok) return { error: "Error al cambiar contraseña" };
  return { success: true };
}
