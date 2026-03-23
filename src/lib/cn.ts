import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Función cn (className merger) 
 * Utilidad muy común para fusionar clases de Tailwind CSS en componentes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
