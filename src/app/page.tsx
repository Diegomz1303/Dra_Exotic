"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Toaster, toast } from 'sonner';
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions/auth";

export default function PaginaInicio() {
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem("dra_exotic_email");
    const savedPass = localStorage.getItem("dra_exotic_pass");
    if (savedEmail) {
      setEmail(savedEmail);
      setRecordarme(true);
    }
    if (savedPass) setPassword(savedPass);
  }, []);

  const procesarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await signIn(formData);
    
    setCargando(false);

    if (!result?.success) {
      toast.error(result?.error || "Error al iniciar sesión", {
        position: 'top-center',
        style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#ff4d4f', color: 'white', border: 'none' }
      });
      return;
    }

    if (recordarme) {
      localStorage.setItem("dra_exotic_email", email);
      localStorage.setItem("dra_exotic_pass", password);
    } else {
      localStorage.removeItem("dra_exotic_email");
      localStorage.removeItem("dra_exotic_pass");
    }

    toast.success('¡Bienvenida, Dra Exotic!', {
      position: 'top-center',
      style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#fc855f', color: 'white', border: 'none' }
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Añadimos los toaster (notificaciones) estéticamente integrados */}
      <Toaster />
      
      {/* Elementos decoraivos de fondo - MIX VERDE Y NARANJA */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#8DAA68]/10 rounded-full filter blur-[100px] opacity-60 pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#fc855f]/10 rounded-full filter blur-[100px] opacity-40 pointer-events-none animate-pulse animation-delay-200"></div>
      
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
            <h2 className="text-[#8DAA68] font-light tracking-[0.2em] text-[11px] uppercase mb-3 ml-1">
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
                className="w-full h-8 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] transition-all text-slate-600 placeholder:text-[#c4c4c4] placeholder:font-light font-light text-[15px] tracking-wide px-1"
                placeholder="lindamail@ejemplo.com"
              />
              <CheckCircle2 className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500 ease-in-out ${email.includes('@') ? 'text-[#8DAA68]' : 'text-transparent'}`} />
            </div>

            {/* Input Contraseña */}
            <div className="relative group">
              <input 
                type={mostrarPass ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-8 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] transition-all text-[#3b3a62] placeholder:text-[#a0a0b2]/50 placeholder:font-light font-light text-[15px] px-1 tracking-[0.3em]"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setMostrarPass(!mostrarPass)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#a0a0b2] hover:text-[#8DAA68] transition-colors"
              >
                {mostrarPass ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>

            {/* Recordarme Checkbox */}
            <div className="flex items-center gap-3 ml-1 pt-2">
              <input 
                type="checkbox" 
                id="recordarme" 
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                className="w-4 h-4 rounded border-[#eef2e8] text-[#8DAA68] focus:ring-[#8DAA68] accent-[#8DAA68] cursor-pointer"
              />
              <label htmlFor="recordarme" className="text-[13px] text-[#a0a0b2] font-light cursor-pointer hover:text-[#8DAA68] transition-colors">
                Recordar mis credenciales
              </label>
            </div>

            {/* Botón de envío */}
            <div className="pt-6 flex flex-col items-center md:items-start w-full gap-8">
              <button 
                type="submit"
                disabled={cargando}
                className="w-full md:w-48 rounded-2xl bg-gradient-to-r from-[#8DAA68] to-[#fc855f] text-white font-medium text-[15px] h-[54px] shadow-[0_10px_20px_rgba(141,170,104,0.2)] hover:shadow-[0_15px_30px_rgba(252,133,95,0.2)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center mx-auto md:ml-auto md:mr-0 tracking-widest uppercase"
              >
                {cargando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Iniciar Sesión"
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
