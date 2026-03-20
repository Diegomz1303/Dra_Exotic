import { createClient } from "@insforge/sdk";

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL as string,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY as string,
});
