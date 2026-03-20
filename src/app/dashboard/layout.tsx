"use client";

import { ReactNode } from "react";
import { LayoutDashboard, CalendarHeart, PawPrint, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fcfcfd] flex font-sans">
      <aside className="w-64 bg-white border-r border-[#fcfcfd] flex-col items-center py-10 shadow-[4px_0_24px_rgba(0,0,0,0.015)] hidden md:flex">
        
        <div className="mb-14 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#fc855f] to-[#ff9770] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_4px_14px_0_rgba(252,133,95,0.39)]">
            <PawPrint className="text-white w-6 h-6" />
          </div>
          <h2 className="text-[#3b3a62] font-medium tracking-wide">Dra Exotic</h2>
          <p className="text-[11px] text-[#a0a0b2] font-light mt-1 tracking-wider uppercase">Panel Administrativo</p>
        </div>

        <nav className="flex-1 w-full px-6 space-y-2">
          <MenuLink href="/dashboard" icon={<LayoutDashboard size={20} strokeWidth={1.5} />} text="Dashboard" />
          <MenuLink href="/dashboard/citas" icon={<CalendarHeart size={20} strokeWidth={1.5} />} text="Citas" />
          <MenuLink href="/dashboard/pacientes" icon={<PawPrint size={20} strokeWidth={1.5} />} text="Pacientes" />
          <MenuLink href="#" icon={<Settings size={20} strokeWidth={1.5} />} text="Configuración" />
        </nav>

        <div className="w-full px-6 mt-10">
          <Link href="/" className="flex items-center gap-3 text-[#a0a0b2] font-light text-[15px] px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors w-full group">
            <LogOut size={20} strokeWidth={1.5} className="group-hover:text-[#fc855f] transition-colors" />
            <span className="group-hover:text-[#fc855f] transition-colors">Cerrar Sesión</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white/60 backdrop-blur-md border-b border-white flex items-center px-10 shadow-[0_4px_24px_rgba(0,0,0,0.01)] relative z-10">
          <div>
            <h1 className="text-[22px] font-light text-[#3b3a62] tracking-wide">Centro de Control</h1>
            <p className="text-xs text-[#a0a0b2] font-light mt-1">¡Buenos días, Dra. Exotic!</p>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#ffe4dc] to-[#ffece6] border-2 border-white shadow-sm flex items-center justify-center text-[#fc855f] font-medium text-lg">
              E
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function MenuLink({ icon, text, href = "#" }: { icon: ReactNode, text: string, href?: string }) {
  const pathname = usePathname();
  // Validamos que el dashboard principal se pinte exacto, o las sub-rutas
  const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));

  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-[14px] rounded-2xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-[#fc855f]/10 to-transparent text-[#fc855f] font-medium' : 'text-[#a0a0b2] font-light hover:bg-[#fc855f]/5 hover:text-[#fc855f]'}`}>
      <span className={active ? 'text-[#fc855f]' : ''}>{icon}</span>
      <span className="text-[15px]">{text}</span>
    </Link>
  );
}
