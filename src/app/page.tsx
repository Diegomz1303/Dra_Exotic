"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Toaster, toast } from 'sonner';
import { useRouter } from "next/navigation";

export default function PaginaInicio() {
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const procesarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    
    // MOCK LOGIN: Por ahora admite cualquier cosa y redirige al Dashboard
    setTimeout(() => {
      setCargando(false);
      toast.success('¡Bienvenida, Dra Exotic!', {
        position: 'top-center',
        style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#fc855f', color: 'white', border: 'none' }
      });
      // Navegar suavemente al dashboard
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Añadimos los toaster (notificaciones) estéticamente integrados */}
      <Toaster />
      
      {/* Elemento lateral orgánico tipo mancha (blob) sutil */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#fff0f0] rounded-full filter blur-[100px] opacity-60 pointer-events-none"></div>
      
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-16 lg:gap-32 relative z-10">
        
        {/* Lado Izquierdo: Ilustración botánica/delicada */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex-1 w-full max-w-sm md:max-w-md mix-blend-multiply flex justify-center"
        >
          <img 
            src="/plant_illustration.png" 
            alt="Delicada ilustración de planta" 
            className="w-full h-auto drop-shadow-sm max-w-[80%] lg:max-w-[90%] object-contain" 
          />
        </motion.div>

        {/* Lado Derecho: Formulario Minimalista */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="flex-1 w-full flex flex-col items-center md:items-start max-w-sm px-6"
        >
          {/* Título de la Clínica muy delicado */}
          <div className="w-full text-center md:text-left mb-12">
            <h2 className="text-[#fc855f] font-light tracking-[0.2em] text-[11px] uppercase mb-3 ml-1">
              Dra Exotic
            </h2>
            <h1 className="text-5xl md:text-6xl text-[#3b3a62] font-light tracking-wide">
              Login
            </h1>
          </div>

          <form onSubmit={procesarLogin} className="w-full space-y-10 relative">
            
            {/* Input Correo */}
            <div className="relative group">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-8 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-slate-600 placeholder:text-[#c4c4c4] placeholder:font-light font-light text-[15px] tracking-wide px-1"
                placeholder="lindamail@ejemplo.com"
              />
              <CheckCircle2 className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500 ease-in-out ${email.includes('@') ? 'text-[#fc855f]' : 'text-transparent'}`} />
            </div>

            {/* Input Contraseña */}
            <div className="relative group">
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-8 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#fc855f]/50 placeholder:font-light font-light text-[15px] px-1 tracking-[0.3em]"
                placeholder="••••••••"
              />
            </div>

            {/* Botón de envío */}
            <div className="pt-6 flex flex-col items-center md:items-start w-full gap-8">
              <button 
                type="submit"
                disabled={cargando}
                className="w-36 rounded-full bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white font-medium text-[15px] h-[42px] shadow-[0_4px_14px_0_rgba(252,133,95,0.39)] hover:shadow-[0_6px_20px_rgba(252,133,95,0.23)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center mx-auto md:ml-auto md:mr-0"
              >
                {cargando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>

              <button type="button" className="text-[13px] text-[#b8b8cc] font-light hover:text-[#fc855f] transition-colors cursor-pointer w-full text-center mt-6 tracking-wide italic">
                Forgot password?
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
