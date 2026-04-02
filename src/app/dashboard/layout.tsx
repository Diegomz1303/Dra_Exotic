"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { PawPrint, Users, Calendar, Clock, LogOut, Menu, X, Camera } from "lucide-react";
import { Toaster } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, getUserProfile, updateProfileFoto } from "@/app/actions/auth";
import { insforge } from "@/lib/insforge";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [nombreDra, setNombreDra] = useState("Dra Exotic");
  const [greeting, setGreeting] = useState("¡Buenos días!");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMenuAbierto(false);
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) setGreeting("¡Buenos días!");
    else if (hours >= 12 && hours < 19) setGreeting("¡Buenas tardes!");
    else setGreeting("¡Buenas noches!");

    async function loadUser() {
      try {
        const profile = await getUserProfile();
        if (profile?.user_metadata?.nombre_clinica) setNombreDra(profile.user_metadata.nombre_clinica);
        if (profile?.user_metadata?.foto_perfil) setFotoPerfil(profile.user_metadata.foto_perfil);
      } catch (e) { console.error("Error cargando perfil", e); }
    }
    loadUser();
  }, [pathname]);

  const iniciales = nombreDra ? nombreDra.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'DR';

  const comprimirImagen = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; // Avatar doesn't need to be huge
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.6);
        };
      };
    });
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSubiendoFoto(true);
    try {
      // 1. Mostrar preview inmediato
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setFotoPerfil(ev.target.result as string); };
      reader.readAsDataURL(file);

      // 2. Comprimir la imagen
      const fotoComprimida = await comprimirImagen(file);

      // 3. Eliminar foto anterior si existe
      if (fotoPerfil && fotoPerfil.includes('supabase.co')) {
        try {
          // Extraer el nombre del archivo de la URL
          const urlParts = fotoPerfil.split('/');
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await insforge.storage.from('historial').remove(fileName);
          }
        } catch (err) {
          console.error("Error al borrar foto anterior", err);
        }
      }

      // 4. Subir la nueva foto
      const fileName = `avatar_${Date.now()}_${fotoComprimida.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const { data, error } = await insforge.storage.from('historial').upload(fileName, fotoComprimida);
      
      if (error) throw error;

      // Obtener URL pública
      const publicUrl = insforge.storage.from('historial').getPublicUrl(fileName) as string;

      // 5. Actualizar metadata del usuario
      const response = await updateProfileFoto(publicUrl);

      if (response?.error) throw new Error(response.error);

      setFotoPerfil(publicUrl);
    } catch (error) {
      console.error("Error procesando foto:", error);
    } finally {
      setSubiendoFoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f0] flex font-sans relative">
      {/* Overlay móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150] md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* ─── SIDEBAR FLOTANTE ─── */}
      <aside className={`
        fixed z-[200] h-[calc(100vh-2rem)] my-4 ml-4
        w-[230px] flex flex-col
        bg-gradient-to-b from-[#8DAA68] to-[#7a9459]
        rounded-2xl shadow-[0_8px_40px_rgba(141,170,104,0.35)]
        transition-transform duration-300 ease-in-out
        ${menuAbierto ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
      `}>
        {/* Botón cerrar (móvil) */}
        <button onClick={() => setMenuAbierto(false)} className="absolute top-3 right-3 md:hidden text-white/60 hover:bg-white/10 p-1.5 rounded-lg">
          <X size={18} />
        </button>

        {/* ── Perfil ── */}
        <div className="pt-8 pb-5 px-5 flex flex-col items-center border-b border-white/10">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shadow-[0_6px_20px_rgba(252,133,95,0.45)] ${fotoPerfil ? '' : 'bg-gradient-to-br from-[#fc855f] to-[#f06035]'}`}>
              {fotoPerfil
                ? <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                : <span className="text-white font-semibold text-[20px] leading-none tracking-wide">{iniciales}</span>
              }
            </div>
            {/* Hover cámara */}
            <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {subiendoFoto
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={16} className="text-white" />
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
          </div>

          <h2 className="text-white font-semibold text-[14px] mt-3 leading-tight text-center">{nombreDra}</h2>
          <span className="text-[10px] text-white/40 font-light uppercase tracking-widest mt-0.5">Panel Administrativo</span>
        </div>

        {/* ── Navegación ── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <MenuLink href="/dashboard"            icon={<PawPrint size={17} strokeWidth={1.75} />} text="Dashboard" />
          <MenuLink href="/dashboard/calendario" icon={<Calendar  size={17} strokeWidth={1.75} />} text="Calendario" />
          <MenuLink href="/dashboard/citas"      icon={<Clock     size={17} strokeWidth={1.75} />} text="Lista de Citas" />
          <MenuLink href="/dashboard/pacientes"  icon={<Users     size={17} strokeWidth={1.75} />} text="Pacientes" />
        </nav>

        {/* ── Cerrar sesión ── */}
        <div className="px-3 pb-5 pt-2 border-t border-white/10">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 text-white/40 text-[13px] px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white/80 transition-colors w-full group cursor-pointer"
          >
            <LogOut size={16} strokeWidth={1.75} className="group-hover:text-[#fc855f] transition-colors shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ─── */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-[262px]">

        {/* Header flotante */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-2 pointer-events-none">
          <header className="pointer-events-auto h-[62px] bg-white rounded-2xl flex items-center px-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100">
            <button
              onClick={() => setMenuAbierto(true)}
              className="mr-4 text-[#3b3a62] p-1.5 bg-slate-50 rounded-lg border border-slate-100 md:hidden hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-[17px] md:text-[19px] font-light text-[#3b3a62] tracking-wide">Centro de Control</h1>
              <p className="text-[10px] text-[#a0a0b2] font-light mt-0.5">{greeting}, {nombreDra}!</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#fc855f] to-[#f06035] flex items-center justify-center text-white font-semibold text-[13px] shadow-sm border-2 border-white">
                {fotoPerfil
                  ? <img src={fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
                  : iniciales[0]
                }
              </div>
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pt-2">
          {children}
        </main>
      </div>

      <Toaster position="top-right" richColors expand={false} />
    </div>
  );
}

function MenuLink({ icon, text, href = "#" }: { icon: ReactNode, text: string, href?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13.5px]
        ${active
          ? 'bg-[#fc855f] text-white font-semibold shadow-[0_4px_14px_rgba(252,133,95,0.4)]'
          : 'text-white/55 hover:bg-white/10 hover:text-white/90 font-light'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}
