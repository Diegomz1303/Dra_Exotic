"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Save, Loader2, ShieldCheck, Mail, PawPrint } from "lucide-react";
import { getUserProfile, updateProfileInfo, updateUserPassword } from "@/app/actions/auth";
import { toast } from "sonner";

export default function AjustesPage() {
  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("Dra Exotic");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [guardandoPass, setGuardandoPass] = useState(false);

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const profile = await getUserProfile();
        if (profile) {
          setEmail(profile.email || "");
          if (profile.user_metadata?.nombre_clinica) setNombre(profile.user_metadata.nombre_clinica);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    }
    cargarUsuario();
  }, []);

  const nombrarClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      const res = await updateProfileInfo(nombre);
      if (res.error) throw new Error(res.error);
      toast.success("Preferencias actualizadas. Refresca para ver cambios globales.");
    } catch (error) {
      toast.error("Error al actualizar perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas maestras no emparejan.");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    
    setGuardandoPass(true);
    try {
      const res = await updateUserPassword(password);
      if (res.error) throw new Error(res.error);
      toast.success("Tu contraseña maestra ha sido blindada con éxito.", {
         style: { background: '#fef2f2', color: '#e11d48', border: '1px solid #ffe4e6' }
      });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Hubo un error al cambiar la contraseña en la nube.");
    } finally {
      setGuardandoPass(false);
    }
  };

  if (cargando) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-[#fc855f] opacity-50"/></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto space-y-8 relative z-10 pb-20">
       <div className="mb-10">
          <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide">Ajustes del Sistema</h2>
          <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">Gestiona tu identidad, credenciales y opciones de seguridad.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Perfil */}
         <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-[#fcfcfd] shadow-[0_4px_24px_rgba(0,0,0,0.015)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/3 pointer-events-none transition-opacity group-hover:opacity-20"></div>

            <div className="w-14 h-14 rounded-[1.2rem] bg-orange-50 flex items-center justify-center mb-6 relative z-10">
               <User className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-medium text-[#3b3a62] mb-1 relative z-10">Perfil Médico</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light leading-relaxed mb-8 relative z-10">Nombre visible de la clínica en los reportes y saludos del panel.</p>
            
            <form onSubmit={nombrarClinica} className="space-y-6 relative z-10">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold block mb-2 ml-1">Correo Vinculado</label>
                <div className="relative group cursor-not-allowed">
                  <input type="text" disabled value={email} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-medium text-[14px] pl-10 cursor-not-allowed shadow-inner" />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              </div>
              <div className="relative group">
                 <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold block mb-2 ml-1">Nombre Desplegado</label>
                 <div className="relative">
                   <input type="text" value={nombre} onChange={(e)=>setNombre(e.target.value)} required className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] text-[#fc855f] pl-9 text-[15px] transition-colors" />
                   <PawPrint className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50 group-focus-within:text-[#fc855f] transition-colors" />
                 </div>
              </div>
              <button type="submit" disabled={guardandoPerfil} className="w-full rounded-2xl text-[#fc855f] bg-[#fff4f1] hover:bg-[#ffece6] font-medium text-[15px] h-12 transition-all flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50">
                 {guardandoPerfil ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 text-[#fc855f]/80" /> Guardar Perfil</>}
              </button>
            </form>
         </div>

         {/* Seguridad */}
         <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-[#fcfcfd] shadow-[0_4px_24px_rgba(0,0,0,0.015)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.07] translate-x-1/2 -translate-y-1/3 pointer-events-none transition-opacity group-hover:opacity-15"></div>
            
            <div className="w-14 h-14 rounded-[1.2rem] bg-rose-50 flex items-center justify-center mb-6 relative z-10">
               <ShieldCheck className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-xl font-medium text-[#3b3a62] mb-1 relative z-10">Seguridad Extrema</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light leading-relaxed mb-8 relative z-10">Actualiza tu contraseña maestra directamente en los servidores encriptados de InsForge.</p>
            
            <form onSubmit={cambiarPass} className="space-y-6 relative z-10 flex flex-col h-full">
              <div className="relative group">
                 <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="Contraseña Nueva" className="w-full h-11 bg-transparent border-b border-rose-100 focus:outline-none focus:border-rose-400 text-rose-500 pl-9 text-[15px] transition-colors placeholder:text-rose-200" />
                 <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300 group-focus-within:text-rose-400 transition-colors" />
              </div>
              <div className="relative group mb-4">
                 <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required placeholder="Confirmar Contraseña" className="w-full h-11 bg-transparent border-b border-rose-100 focus:outline-none focus:border-rose-400 text-rose-500 pl-9 text-[15px] transition-colors placeholder:text-rose-200" />
                 <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300 group-focus-within:text-rose-400 transition-colors" />
              </div>
              <div className="mt-auto pt-4">
                 <button type="submit" disabled={guardandoPass} className="w-full rounded-2xl text-white font-medium text-[15px] h-12 bg-gradient-to-r from-rose-400 to-rose-500 transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(251,113,133,0.3)] hover:shadow-[0_12px_25px_rgba(251,113,133,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 border border-white/20">
                    {guardandoPass ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Blindar Contraseña</>}
                 </button>
              </div>
            </form>
         </div>
       </div>
    </motion.div>
  );
}
