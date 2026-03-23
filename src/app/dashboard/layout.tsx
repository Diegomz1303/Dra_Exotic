"use client";

import { ReactNode, useState, useEffect } from "react";
import { Home, Users, Calendar, Clock, LogOut, Settings, Menu, X, Bell, User } from "lucide-react";
import { Toaster } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, getUserProfile } from "@/app/actions/auth";
import { insforge } from "@/lib/insforge";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [nombreDra, setNombreDra] = useState("Dra Exotic");
  const [scrolled, setScrolled] = useState(false);
  const [greeting, setGreeting] = useState("¡Buenos días!");
  const pathname = usePathname();

  useEffect(() => {
    setMenuAbierto(false);

    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) setGreeting("¡Buenos días!");
    else if (hours >= 12 && hours < 19) setGreeting("¡Buenas tardes!");
    else setGreeting("¡Buenas noches!");

    const handleScroll = () => setScrolled(window.scrollY > 20);

    async function loadUser() {
      try {
        const profile = await getUserProfile();
        if (profile?.user_metadata?.nombre_clinica) {
          setNombreDra(profile.user_metadata.nombre_clinica);
        }
      } catch (e) {
        console.error("Error cargando perfil", e);
      }
    }
    loadUser();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex font-sans relative overflow-hidden md:overflow-auto">
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-[#3b3a62]/20 backdrop-blur-sm z-[150] md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`fixed md:relative z-[200] w-64 bg-white border-r border-[#fcfcfd] flex flex-col items-center py-10 shadow-[4px_0_24px_rgba(0,0,0,0.015)] h-screen transition-transform duration-300 ease-in-out ${menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <button onClick={() => setMenuAbierto(false)} className="absolute top-4 right-4 md:hidden text-[#a0a0b2] hover:bg-slate-50 p-2 rounded-full">
          <X size={20} />
        </button>

        <div className="mb-14 text-center mt-4 md:mt-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[#8DAA68] to-[#9dbd75] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_4px_14px_0_rgba(141,170,104,0.3)]">
            <Home className="text-white w-6 h-6" />
          </div>
          <h2 className="text-[#3b3a62] font-medium tracking-wide">{nombreDra}</h2>
          <p className="text-[11px] text-[#a0a0b2] font-light mt-1 tracking-wider uppercase">Panel Administrativo</p>
        </div>

        <nav className="flex-1 w-full px-6 space-y-2 overflow-y-auto">
          <MenuLink href="/dashboard" icon={<Home size={20} strokeWidth={1.5} />} text="Dashboard" />
          <MenuLink href="/dashboard/calendario" icon={<Calendar size={20} strokeWidth={1.5} />} text="Calendario" />
          <MenuLink href="/dashboard/citas" icon={<Clock size={20} strokeWidth={1.5} />} text="Lista de Citas" />
          <MenuLink href="/dashboard/pacientes" icon={<Users size={20} strokeWidth={1.5} />} text="Pacientes" />
          <MenuLink href="/dashboard/ajustes" icon={<Settings size={20} strokeWidth={1.5} />} text="Configuración" />
        </nav>

        <div className="w-full px-6 mt-10">
          <button onClick={() => signOut()} className="flex items-center gap-3 text-[#a0a0b2] font-light text-[15px] px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors w-full group text-left cursor-pointer">
            <LogOut size={20} strokeWidth={1.5} className="group-hover:text-[#8DAA68] transition-colors" />
            <span className="group-hover:text-[#8DAA68] transition-colors">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="h-24 bg-white/60 backdrop-blur-md border-b border-white flex items-center px-6 md:px-10 shadow-[0_4px_24px_rgba(0,0,0,0.01)] relative z-10">
          <button 
            onClick={() => setMenuAbierto(true)} 
            className="mr-4 text-[#3b3a62] p-2 bg-white rounded-lg shadow-sm border border-slate-100 md:hidden hover:bg-slate-50 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-[20px] md:text-[22px] font-light text-[#3b3a62] tracking-wide">Centro de Control</h1>
            <p className="text-[10px] md:text-xs text-[#a0a0b2] font-light mt-1">{greeting}, {nombreDra}!</p>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-r from-[#f4f7f0] to-[#eef2e8] border-2 border-white shadow-sm flex items-center justify-center text-[#8DAA68] font-medium text-lg uppercase">
              {nombreDra ? nombreDra[0] : 'E'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pt-24 md:pt-32">
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
    <Link href={href} className={`flex items-center gap-3 px-4 py-[14px] rounded-2xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-[#8DAA68]/10 to-transparent text-[#8DAA68] font-medium' : 'text-[#a0a0b2] font-light hover:bg-[#8DAA68]/5 hover:text-[#8DAA68]'}`}>
      <span className={active ? 'text-[#8DAA68]' : ''}>{icon}</span>
      <span className="text-[15px]">{text}</span>
    </Link>
  );
}
