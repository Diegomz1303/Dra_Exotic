"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, CalendarCheck, Activity, Star, Loader2, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { insforge } from "@/servicios/insforge";

export default function Dashboard() {
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ pacientes: 0, consultas: 0 });

  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [creando, setCreando] = useState(false);
  const [mostrandoInput, setMostrandoInput] = useState(false);
  
  const [editandoRecordatorioId, setEditandoRecordatorioId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      const hoy = new Date().toISOString().split('T')[0];
      
      const [resCitas, resPacientes, resConsultas, resNotas] = await Promise.all([
         insforge.database.from("citas").select().eq("fecha", hoy),
         insforge.database.from("pacientes").select('*', { count: 'exact', head: true }),
         insforge.database.from("citas").select('*', { count: 'exact', head: true }).eq("estado", "Completada"),
         insforge.database.from("recordatorios").select('*').order('fecha', { ascending: false })
      ]);
      
      if (!resCitas.error && resCitas.data) setCitas(resCitas.data);
      if (!resNotas.error && resNotas.data) setRecordatorios(resNotas.data);
      
      setStats({
         pacientes: resPacientes.count || 0,
         consultas: resConsultas.count || 0
      });

      setCargando(false);
    }
    
    cargarDatos();
  }, []);

  const agregarRecordatorio = async (e: any) => {
    e.preventDefault();
    if(!nuevoTexto.trim()) return;
    setCreando(true);
    const nuevo = { texto: nuevoTexto.trim() };
    const { data, error } = await insforge.database.from("recordatorios").insert([nuevo]).select();
    if(!error && data) {
       setRecordatorios([data[0], ...recordatorios]);
       setNuevoTexto("");
       setMostrandoInput(false);
    }
    setCreando(false);
  };

  const completarRecordatorio = async (id: string, actual: boolean) => {
    // Optimistic UI
    setRecordatorios(recordatorios.map(r => r.id === id ? { ...r, completado: !actual } : r));
    await insforge.database.from("recordatorios").update({ completado: !actual }).eq("id", id);
  };

  const iniciarEdicionRecordatorio = (r: any) => {
    setEditandoRecordatorioId(r.id);
    setTextoEditado(r.texto);
  };

  const guardarEdicionRecordatorio = async (e: any, id: string) => {
    if(e && e.preventDefault) e.preventDefault();
    if(!textoEditado.trim()) { setEditandoRecordatorioId(null); return; }
    // optimistic UI
    setRecordatorios(recordatorios.map(r => r.id === id ? { ...r, texto: textoEditado.trim() } : r));
    setEditandoRecordatorioId(null);
    await insforge.database.from("recordatorios").update({ texto: textoEditado.trim() }).eq("id", id);
  };

  const eliminarRecordatorio = async (id: string) => {
    // optimistic UI
    setRecordatorios(recordatorios.filter(r => r.id !== id));
    await insforge.database.from("recordatorios").delete().eq("id", id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard icon={<Users strokeWidth={1.5} />} title="Pacientes Registrados" value={cargando ? "-" : stats.pacientes.toString()} trend="Total en el directorio" color="blue" />
        <StatCard icon={<CalendarCheck strokeWidth={1.5} />} title="Turnos para Hoy" value={cargando ? "-" : citas.length.toString()} trend={citas.length > 0 ? "Pendientes de revisión" : "Día libre por ahora"} color="orange" />
        <StatCard icon={<Activity strokeWidth={1.5} />} title="Consultas Finalizadas" value={cargando ? "-" : stats.consultas.toString()} trend="Expedientes creados" color="teal" />
      </div>

      {/* Sección Inferior dividida en Columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Próximas Citas */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-8 md:p-10 border border-[#fcfcfd] shadow-[0_8px_40px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 relative z-10 gap-4">
            <h3 className="text-[#3b3a62] font-light text-2xl tracking-wide flex items-center gap-2">
              Pacientes para Hoy
              {cargando && <Loader2 className="w-5 h-5 animate-spin text-[#fc855f] ml-2" />}
            </h3>
            <button className="text-[#fc855f] text-sm font-light hover:underline underline-offset-4 tracking-wide whitespace-nowrap">
              {citas.length > 0 ? `${citas.length} registrados` : 'Ver calendario'}
            </button>
          </div>
          
          <div className="space-y-4 relative z-10 min-h-[150px]">
            {cargando ? (
              <div className="flex flex-col items-center justify-center h-full text-[#a0a0b2] space-y-4 p-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#ffe4dc]" />
                <p className="font-light text-sm italic">Sincronizando la agenda mágica...</p>
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
                  estado={cita.estado}
                />
              ))
            )}
          </div>
        </div>

        {/* Notificaciones / Recordatorios */}
        <div className="bg-gradient-to-br from-[#fc855f] to-[#ff9770] rounded-[2rem] p-8 md:p-10 text-white shadow-[0_12px_40px_rgba(252,133,95,0.25)] relative overflow-hidden flex flex-col h-[500px]">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full opacity-10 translate-x-1/3 translate-y-1/3 blur-xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-white/90" strokeWidth={1.5} />
              <h3 className="font-light text-2xl tracking-wide">Recordatorios</h3>
            </div>
            <button onClick={() => setMostrandoInput(!mostrandoInput)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <Plus className={`w-4 h-4 transition-transform ${mostrandoInput ? 'rotate-45' : ''}`} />
            </button>
          </div>

          <div className="space-y-4 relative z-10 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
            <AnimatePresence>
              {mostrandoInput && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={agregarRecordatorio} className="mb-4">
                   <div className="flex gap-2">
                     <input type="text" autoFocus value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)} placeholder="Escribe un recordatorio..." className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white/50 text-[14px] w-full" />
                     <button type="submit" disabled={creando} className="bg-white/20 px-4 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors shrink-0">{creando ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar'}</button>
                   </div>
                </motion.form>
              )}
            </AnimatePresence>
          
            {cargando ? (
               <div className="flex justify-center items-center h-20 text-white/70"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : recordatorios.length === 0 ? (
               <p className="text-white/70 italic text-sm text-center mt-10 font-light">No hay recordatorios pendientes. ¡Todo en orden!</p>
            ) : (
               <AnimatePresence>
                  {recordatorios.map(r => (
                     <motion.div layout key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 transition-all flex items-start gap-3 group overflow-hidden ${r.completado ? 'opacity-50 grayscale-[50%]' : ''}`}>
                       <button onClick={() => completarRecordatorio(r.id, r.completado)} className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center shrink-0 transition-colors z-10 ${r.completado ? 'bg-white/80 border-transparent text-[#fc855f]' : 'border-white/40 hover:bg-white/20 text-transparent'}`}>
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                       </button>
                       {editandoRecordatorioId === r.id ? (
                          <form onSubmit={(e) => guardarEdicionRecordatorio(e, r.id)} className="flex-1 -mt-1.5 -ml-1 z-10 relative">
                             <input type="text" autoFocus value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} onBlur={(e) => guardarEdicionRecordatorio(e, r.id)} className="w-full bg-white/20 backdrop-blur-md rounded-lg p-2 border border-white/30 text-white focus:outline-none focus:ring-1 focus:ring-white/50 text-[14px]" />
                          </form>
                       ) : (
                          <p className={`text-[14px] font-light leading-relaxed flex-1 pr-12 ${r.completado ? 'line-through' : ''}`}>{r.texto}</p>
                       )}
                       
                       {!r.completado && editandoRecordatorioId !== r.id && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-20">
                             <button onClick={() => iniciarEdicionRecordatorio(r)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white/50 hover:bg-white/30 hover:text-white transition-colors" title="Editar">
                                <Pencil className="w-3 h-3" />
                             </button>
                             <button onClick={() => eliminarRecordatorio(r.id)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white/50 hover:bg-red-400/80 hover:text-white transition-colors" title="Eliminar">
                                <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                       )}
                     </motion.div>
                  ))}
               </AnimatePresence>
            )}
          </div>
          
          <button onClick={() => setMostrandoInput(true)} className="w-full mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-white text-[15px] font-medium py-3 rounded-xl flex items-center justify-center gap-2 relative z-10 shadow-sm">
            <Plus className="w-4 h-4" /> Añadir recordatorio
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

function AppointmentItem({ pet, owner, time, type, estado }: any) {
  const isCompleted = estado === 'Completada';
  const isCancelled = estado === 'Cancelada';

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors border group ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 opacity-90' : isCancelled ? 'bg-rose-50/50 border-rose-100 opacity-50 grayscale-[50%]' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-medium text-lg ${isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-500' : isCancelled ? 'bg-rose-100 border-rose-200 text-rose-500' : 'bg-[#fff4f1] border-[#ffe4dc] text-[#fc855f]'}`}>
          {pet ? pet[0].toUpperCase() : '?'}
        </div>
        <div>
          <h5 className={`font-medium text-[15px] flex items-center gap-2 ${isCancelled ? 'line-through text-rose-400' : 'text-[#3b3a62]'}`}>
            {pet} <span className="text-[#a0a0b2] font-light text-sm ml-1">({owner})</span>
          </h5>
          <p className="text-[13px] text-[#a0a0b2] mt-0.5 font-light">{type}</p>
        </div>
      </div>
      <div className={`text-sm font-medium px-4 py-1.5 rounded-full shadow-sm ${isCompleted ? 'text-emerald-600 bg-emerald-100 border border-emerald-200' : isCancelled ? 'text-rose-600 bg-rose-100 border border-rose-200' : 'text-[#fc855f] bg-[#fc855f]/10 border border-[#fc855f]/20 group-hover:bg-[#fc855f] group-hover:text-white transition-colors'}`}>
        {time}
      </div>
    </div>
  );
}
