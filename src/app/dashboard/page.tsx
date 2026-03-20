"use client";

import { motion } from "framer-motion";
import { Users, CalendarCheck, Activity, Star, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { insforge } from "@/servicios/insforge";

export default function Dashboard() {
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarCitas() {
      // 1. Conectamos con la Base de Datos real
      const { data, error } = await insforge.database.from("citas").select();
      
      if (!error && data) {
        setCitas(data); // Insertamos los datos en el estado
      } else {
        console.error("Error cargando base de datos:", error);
      }
      setCargando(false);
    }
    
    cargarCitas();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard icon={<Users strokeWidth={1.5} />} title="Pacientes en Clínica" value="45" trend="Datos protegidos por Insforge" color="blue" />
        <StatCard icon={<CalendarCheck strokeWidth={1.5} />} title="Citas de Hoy" value={citas.length.toString()} trend="Recuento desde Insforge" color="orange" />
        <StatCard icon={<Activity strokeWidth={1.5} />} title="Consultas" value="156" trend="+12% este mes" color="teal" />
      </div>

      {/* Sección Inferior dividida en Columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Próximas Citas */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-8 md:p-10 border border-[#fcfcfd] shadow-[0_8px_40px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-[#3b3a62] font-light text-2xl tracking-wide flex items-center gap-2">
              Tus Próximas Citas
              {cargando && <Loader2 className="w-5 h-5 animate-spin text-[#fc855f] ml-2" />}
            </h3>
            <button className="text-[#fc855f] text-sm font-light hover:underline underline-offset-4 tracking-wide">
              {citas.length > 0 ? `${citas.length} citas en Base de Datos` : 'Ver calendario completo'}
            </button>
          </div>
          
          <div className="space-y-4 relative z-10 min-h-[150px]">
            {cargando ? (
              <div className="flex flex-col items-center justify-center h-full text-[#a0a0b2] space-y-4 p-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#ffe4dc]" />
                <p className="font-light text-sm italic">Conectando a Insforge Database...</p>
              </div>
            ) : citas.length === 0 ? (
              <p className="text-center text-[#a0a0b2] font-light italic p-8">No hay citas registradas en la base de datos.</p>
            ) : (
              citas.map((cita) => (
                <AppointmentItem 
                  key={cita.id}
                  pet={cita.mascota} 
                  owner={cita.dueno} 
                  time={cita.hora} 
                  type={cita.tipo} 
                  isActive={cita.activa} 
                />
              ))
            )}
          </div>
        </div>

        {/* Notificaciones / Recordatorios */}
        <div className="bg-gradient-to-br from-[#fc855f] to-[#ff9770] rounded-[2rem] p-8 md:p-10 text-white shadow-[0_12px_40px_rgba(252,133,95,0.25)] relative overflow-hidden flex flex-col">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full opacity-10 translate-x-1/3 translate-y-1/3 blur-xl"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <Star className="w-6 h-6 text-white/90" strokeWidth={1.5} />
            <h3 className="font-light text-2xl tracking-wide">Recordatorios</h3>
          </div>

          <div className="space-y-4 relative z-10 flex-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors cursor-default">
              <p className="text-[15px] font-light leading-relaxed">El inventario de <strong>Vacunas Antirrábicas</strong> está por debajo del límite sugerido (5 dosis).</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors cursor-default">
              <p className="text-[15px] font-light leading-relaxed">Llamar a los dueños de <strong>Milo</strong> para confirmar la cirugía de mañana.</p>
            </div>
          </div>
          
          <button className="w-full mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-white text-sm font-medium py-3 rounded-xl">
            Añadir recordatorio
          </button>
        </div>

      </div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, trend, color }: any) {
  const colorMap: any = {
    blue: "text-[#6366f1] bg-[#eef2ff]",
    orange: "text-[#fc855f] bg-[#fff4f1]",
    teal: "text-[#14b8a6] bg-[#f0fdfa]"
  };

  return (
    <div className="bg-white rounded-[2rem] p-7 md:p-8 border border-[#fcfcfd] shadow-[0_8px_40px_rgba(0,0,0,0.02)] flex items-center gap-6 hover:shadow-[0_12px_50px_rgba(0,0,0,0.04)] transition-all transform hover:-translate-y-1">
      <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[#a0a0b2] text-[15px] font-light mb-1">{title}</h4>
        <div className="text-3xl font-light text-[#3b3a62]">{value}</div>
        <p className="text-xs text-[#a0a0b2] mt-2 font-light italic">{trend}</p>
      </div>
    </div>
  );
}

function AppointmentItem({ pet, owner, time, type, isActive = false }: any) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors border ${isActive ? 'bg-[#fff4f1] border-[#ffe4dc]' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-medium text-lg ${isActive ? 'bg-white border-[#ffe4dc] text-[#fc855f]' : 'bg-[#fcfcfd] border-slate-100 text-[#a0a0b2]'}`}>
          {pet ? pet[0] : '?'}
        </div>
        <div>
          <h5 className="text-[#3b3a62] font-medium text-[15px]">{pet} <span className="text-[#a0a0b2] font-light text-sm ml-1">({owner})</span></h5>
          <p className="text-[13px] text-[#a0a0b2] mt-0.5 font-light">{type}</p>
        </div>
      </div>
      <div className={`text-sm font-medium px-4 py-1.5 rounded-full ${isActive ? 'text-white bg-gradient-to-r from-[#fc855f] to-[#ff9770] shadow-sm' : 'text-[#fc855f] bg-[#fc855f]/10'}`}>
        {time}
      </div>
    </div>
  );
}
