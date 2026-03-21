"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, Loader2, PawPrint, User, Stethoscope, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, AlertCircle, FileText, UploadCloud, X, Trash2, Pencil } from "lucide-react";
import { insforge } from "@/servicios/insforge";
import { toast } from "sonner";

export default function CitasPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalCitas, setTotalCitas] = useState(0);
  const POR_PAGINA = 5;

  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mascota, setMascota] = useState("");
  const [dueno, setDueno] = useState("");
  const [tipo, setTipo] = useState("");
  const [notas, setNotas] = useState("");
  const [estadoCita, setEstadoCita] = useState("Pendiente"); 

  const [citaAEliminar, setCitaAEliminar] = useState<any>(null);
  const [estadoAConfirmar, setEstadoAConfirmar] = useState<any>(null); // Solo para cancelar
  
  // Modal de Historial (Consulta Médica al completar)
  const [modalConsulta, setModalConsulta] = useState<any>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [subiendoConsulta, setSubiendoConsulta] = useState(false);

  const [sugerenciasPacientes, setSugerenciasPacientes] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("10");
  const [minutoSeleccionado, setMinutoSeleccionado] = useState("00");
  const [amPm, setAmPm] = useState("AM");

  useEffect(() => {
    const delay = setTimeout(() => { cargarCitas(); }, 300);
    return () => clearTimeout(delay);
  }, [busqueda, paginaActual]);

  async function cargarCitas() {
    setCargando(true);
    let query = insforge.database.from("citas").select('*', { count: 'exact' });
    if (busqueda) query = query.or(`mascota.ilike.%${busqueda}%,dueno.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`);
    const { data, count, error } = await query.order('fecha', { ascending: true }).range((paginaActual - 1) * POR_PAGINA, (paginaActual * POR_PAGINA) - 1);
    if (!error && data) { setCitas(data); setTotalCitas(count || 0); }
    setCargando(false);
  }

  const agendarOActualizarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const stringHora = `${horaSeleccionada}:${minutoSeleccionado} ${amPm}`;
    const datosCita = { mascota, dueno, fecha, hora: stringHora, tipo, notas, estado: estadoCita, activa: true };

    if (editandoId) {
      await insforge.database.from("citas").update(datosCita).eq("id", editandoId);
      toast.success("Cita actualizada elegantemente.");
    } else {
      await insforge.database.from("citas").insert([datosCita]);
      toast.success("¡Cita agendada elegantemente!");
    }
    setEnviando(false);
    cancelarEdicion(); cargarCitas(); setMostrarModalForm(false);
  };

  const solicitarCambioEstado = (cita: any, nuevoEstado: string) => {
    if (cita.estado === nuevoEstado) return;
    if (cita.estado === 'Completada' || cita.estado === 'Cancelada') return; // Bloqueado
    if (nuevoEstado === 'Pendiente') {
      cambiarEstadoDirecto(cita.id, nuevoEstado, cita.mascota);
    } else if (nuevoEstado === 'Completada') {
      setDiagnostico(""); setTratamiento(""); setArchivosSeleccionados([]);
      setModalConsulta(cita);
    } else {
      setEstadoAConfirmar({ ...cita, accion: nuevoEstado });
    }
  };

  const cambiarEstadoDirecto = async (id: string, nuevoEstado: string, nombreMascota: string) => {
    const previous = [...citas];
    setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    const { error } = await insforge.database.from("citas").update({ estado: nuevoEstado }).eq("id", id);
    if (error) { setCitas(previous); toast.error("No se pudo actualizar el estado."); } 
    else { toast.success(`Cita marcada como ${nuevoEstado}.`); }
  };

  // Compresión mágica de imágenes
  const comprimirImagen = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(file); // PDFs se quedan intactos
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.6); // 60% calidad hiper-comprimida
        };
      };
    });
  };

  const manejarArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const procesados = await Promise.all(files.map(f => comprimirImagen(f)));
      setArchivosSeleccionados(prev => [...prev, ...procesados]);
    }
  };

  const guardarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubiendoConsulta(true);
    let archivosUrls = [];

    // Subir PDFs e imágenes
    for (let file of archivosSeleccionados) {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      // Usamos el bucket 'historial' asegurandonos que esté creado. Si no está creado, mostrará error en consola pero continuará guardando texto.
      const { data, error } = await insforge.storage.from('historial').upload(fileName, file);
      if (data) {
        const filePath = (data as any).path || (data as any).url || (data as any).key || fileName;
        archivosUrls.push({ url: filePath, nombre: file.name, tipo: file.type });
      } else {
        console.error("Storage error:", error);
      }
    }

    const { error } = await insforge.database.from("citas").update({
      estado: 'Completada',
      diagnostico,
      tratamiento,
      archivos: archivosUrls
    }).eq("id", modalConsulta.id);

    setSubiendoConsulta(false);

    if (error) {
      toast.error("Error guardando expediente.");
    } else {
      toast.success("Expediente clínico guardado y cita completada.", { style: { background: '#ecfeff', color: '#14b8a6', border: 'none' }});
      setModalConsulta(null);
      // Update local state
      setCitas(citas.map(c => c.id === modalConsulta.id ? { ...c, estado: 'Completada', diagnostico, tratamiento, archivos: archivosUrls } : c));
    }
  };

  const ejecutarCambioEstado = () => {
    if(!estadoAConfirmar) return;
    cambiarEstadoDirecto(estadoAConfirmar.id, estadoAConfirmar.accion, estadoAConfirmar.mascota);
    setEstadoAConfirmar(null);
  };

  const eliminarCita = async () => {
    if(!citaAEliminar) return;
    const { error } = await insforge.database.from("citas").delete().eq("id", citaAEliminar.id);
    if(error) toast.error("Error al eliminar el turno.");
    else { toast.success("Turno borrado de la agenda."); setCitaAEliminar(null); cargarCitas(); }
  };

  const iniciarEdicion = (cita: any) => {
    setEditandoId(cita.id);
    setMascota(cita.mascota || ""); setDueno(cita.dueno || ""); setTipo(cita.tipo || ""); setNotas(cita.notas || ""); setEstadoCita(cita.estado || "Pendiente");
    if (cita.fecha) setFecha(cita.fecha);
    setMostrarModalForm(true);
  };

  const cancelarEdicion = () => {
    setEditandoId(null); setMascota(""); setDueno(""); setTipo(""); setNotas(""); setEstadoCita("Pendiente");
    setMostrarPicker(false); setMostrarSugerencias(false);
  };

  const totalPaginas = Math.ceil(totalCitas / POR_PAGINA);
  const hoyStr = new Date().toISOString().split('T')[0];
  const mananaDate = new Date(); mananaDate.setDate(mananaDate.getDate() + 1);
  const mananaStr = mananaDate.toISOString().split('T')[0];

  const citasHoy = citas.filter(c => c.fecha === hoyStr);
  const citasManana = citas.filter(c => c.fecha === mananaStr);
  const citasProximas = citas.filter(c => c.fecha > mananaStr);
  const citasPasadas = citas.filter(c => c.fecha < hoyStr);

  const CitaCard = ({ cita }: { cita: any }) => {
    const isLocked = cita.estado === 'Completada' || cita.estado === 'Cancelada';
    return (
      <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}
        className={`relative flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border transition-all group overflow-hidden 
          ${cita.estado === 'Completada' ? 'bg-emerald-50/40 border-emerald-100 opacity-70' : cita.estado === 'Cancelada' ? 'bg-rose-50/40 border-rose-100 opacity-60 grayscale-[30%]' : 'bg-white border-[#fcfcfd] shadow-[0_4px_15px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.04)]'}`}
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
          {!isLocked && (
            <button onClick={() => iniciarEdicion(cita)} className="w-8 h-8 rounded-full flex items-center justify-center text-teal-400 hover:bg-teal-50 hover:text-teal-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Editar">
               <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setCitaAEliminar(cita)} className="w-8 h-8 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Eliminar">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-start md:items-center gap-5">
          <div className={`w-14 h-14 rounded-full border flex items-center justify-center font-medium text-xl transition-all duration-300
            ${cita.estado === 'Completada' ? 'bg-emerald-100 text-emerald-500 border-emerald-200' : cita.estado === 'Cancelada' ? 'bg-rose-100 text-rose-500 border-rose-200' : 'border-[#ffe4dc] bg-[#fff4f1] text-[#fc855f] group-hover:bg-[#fc855f] group-hover:text-white'}`}>
            {cita.estado === 'Completada' ? <CheckCircle2 className="w-6 h-6" /> : cita.estado === 'Cancelada' ? <X className="w-6 h-6" /> : (cita.mascota ? cita.mascota[0].toUpperCase() : '?')}
          </div>
          <div>
            <h5 className={`font-medium text-[16px] flex items-center gap-2 ${cita.estado === 'Cancelada' ? 'line-through text-rose-400' : 'text-[#3b3a62]'}`}>
              {cita.mascota} <span className={`font-light text-sm ${cita.estado === 'Cancelada' ? 'text-rose-300' : 'text-[#a0a0b2]'}`}>({cita.dueno})</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ml-2
                ${cita.estado === 'Pendiente' || !cita.estado ? 'bg-orange-100 text-orange-500' : cita.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {cita.estado || 'Pendiente'}
              </span>
            </h5>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <p className="text-[14px] text-[#a0a0b2] font-light flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-[#fc855f]/60" /> {cita.tipo}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 flex flex-col md:flex-row items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 pl-0 md:pl-6">
          <div className={`flex bg-slate-50 p-1 rounded-xl w-full md:w-auto h-10 border transition-all ${isLocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : 'border-slate-100/60'}`}>
            <button onClick={() => solicitarCambioEstado(cita, 'Pendiente')} className={`flex-1 md:w-10 rounded-lg flex items-center justify-center transition-all ${(!cita.estado || cita.estado === 'Pendiente') ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-orange-400'}`}><Clock className="w-4 h-4" /></button>
            <button onClick={() => solicitarCambioEstado(cita, 'Completada')} className={`flex-1 md:w-10 rounded-lg flex items-center justify-center transition-all ${cita.estado === 'Completada' ? 'bg-white shadow-sm text-emerald-500' : 'text-slate-400 hover:text-emerald-400'}`} title="Generar Expediente Clínico"><CheckCircle2 className="w-4 h-4" /></button>
            <button onClick={() => solicitarCambioEstado(cita, 'Cancelada')} className={`flex-1 md:w-10 rounded-lg flex items-center justify-center transition-all ${cita.estado === 'Cancelada' ? 'bg-white shadow-sm text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col items-center md:items-end w-full md:w-32 shrink-0">
            <div className={`text-[15px] font-medium flex items-center gap-1.5 ${isLocked ? 'text-[#a0a0b2]' : 'text-[#3b3a62]'}`}>
              {cita.fecha ? cita.fecha.split('-').reverse().slice(0,2).join('/') : '-'} <span className="text-slate-300 mx-1">•</span> {cita.hora.split(' ')[0]}
            </div>
            <div className="text-[11px] font-bold text-[#a0a0b2] uppercase tracking-wider mt-0.5">{cita.hora.split(' ')[1]}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-10">
           {/* UI Básica */}
           <div>
            <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide">Agenda de Turnos</h2>
            <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">Administra y visualiza el calendario completo de pacientes.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
             <button onClick={() => { cancelarEdicion(); setMostrarModalForm(true); }} className="w-full md:w-auto whitespace-nowrap bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white px-8 h-[52px] rounded-full font-medium text-[15px] shadow-sm hover:scale-[1.02] flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Agendar Turno</button>
          </div>
        </div>
        
        <div className="bg-transparent min-h-[500px]">
          {cargando ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-[#a0a0b2] space-y-4"><Loader2 className="w-8 h-8 animate-spin text-[#fc855f]/50" /></div>
          ) : (
            <div className="w-full space-y-12">
              <AnimatePresence>
                {citasHoy.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><h3 className="text-[14px] uppercase tracking-widest font-bold text-[#fc855f] border-b border-[#ffd1c3]/30 pb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#fc855f] animate-pulse"></span> Turnos para Hoy</h3><div className="flex flex-col gap-4">{citasHoy.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
                {citasManana.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><h3 className="text-[14px] uppercase tracking-widest font-bold text-[#3b3a62]/60 border-b border-slate-200 pb-3">Para Mañana</h3><div className="flex flex-col gap-4">{citasManana.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
                {citasProximas.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><h3 className="text-[14px] uppercase tracking-widest font-bold text-[#3b3a62]/60 border-b border-slate-200 pb-3">Próximos Días</h3><div className="flex flex-col gap-4">{citasProximas.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
                {citasPasadas.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 opacity-70"><h3 className="text-[14px] uppercase tracking-widest font-bold text-slate-400 border-b border-slate-200 pb-3">Histórico Anterior</h3><div className="flex flex-col gap-4">{citasPasadas.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
              </AnimatePresence>
              
              {totalPaginas > 1 && (
                <div className="flex justify-center flex-wrap items-center gap-3 mt-12 mb-4">
                  <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#fff4f1] disabled:opacity-40"><ChevronLeft className="w-5 h-5 ml-0.5" /></button>
                  <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-full shadow-sm">{Array.from({length: totalPaginas}, (_, i) => i + 1).map(p => (<button key={p} onClick={() => setPaginaActual(p)} className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${paginaActual === p ? 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white shadow-md' : 'text-[#a0a0b2] hover:bg-[#fff4f1]'}`}>{p}</button>))}</div>
                  <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#fff4f1] disabled:opacity-40"><ChevronRight className="w-5 h-5 mr-0.5" /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* MODAL DE HISTORIAL CLÍNICO (NUEVO) */}
      <AnimatePresence>
        {modalConsulta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 w-full max-w-2xl shadow-[0_20px_80px_rgba(20,184,166,0.3)] border border-teal-50 relative my-8 overflow-hidden">
               <button onClick={() => setModalConsulta(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-[#a0a0b2] hover:text-rose-500 transition-colors z-[350]"><X className="w-5 h-5" /></button>
               <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/3 pointer-events-none"></div>

               <div className="flex items-center gap-4 mb-8 relative z-10">
                 <div className="w-14 h-14 rounded-[1.2rem] bg-teal-50 flex items-center justify-center shadow-sm">
                   <Stethoscope className="w-6 h-6 text-teal-500" />
                 </div>
                 <div>
                   <h3 className="text-[#3b3a62] font-medium text-2xl">Expediente Clínico</h3>
                   <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Completando turno de <strong className="text-teal-600 font-medium">{modalConsulta.mascota}</strong></p>
                 </div>
               </div>

               <form onSubmit={guardarConsulta} className="space-y-6 relative z-10">
                  <div className="bg-teal-50/30 p-4 rounded-xl border border-teal-100/50">
                    <label className="text-[11px] uppercase tracking-wider text-teal-600 font-semibold mb-2 block ml-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Diagnóstico Médico</label>
                    <textarea required value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={3} className="w-full bg-white rounded-lg p-3 text-[14px] text-[#3b3a62] border border-teal-100 focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-300" placeholder="Describe los síntomas y el diagnóstico de la mascota..."></textarea>
                  </div>

                  <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                    <label className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold mb-2 block ml-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Tratamiento / Receta</label>
                    <textarea required value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} rows={3} className="w-full bg-white rounded-lg p-3 text-[14px] text-[#3b3a62] border border-emerald-100 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300" placeholder="Indica los medicamentos, dosis y pasos a seguir..."></textarea>
                  </div>

                  <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                    <label className="text-[11px] uppercase tracking-wider text-blue-600 font-semibold mb-2 block ml-1 flex items-center gap-1.5"><UploadCloud className="w-3.5 h-3.5"/> Subir Análisis o PDF (Se comprime automático)</label>
                    <div className="relative w-full h-24 border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center bg-white hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden">
                      <input type="file" multiple accept=".pdf,image/jpeg,image/png" onChange={manejarArchivos} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                      <div className="text-center text-blue-400">
                         <UploadCloud className="w-6 h-6 mx-auto mb-1" />
                         <span className="text-[13px] font-medium">Toca o arrastra PDFs / Imágenes</span>
                      </div>
                    </div>
                    {archivosSeleccionados.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                         {archivosSeleccionados.map((f, i) => (
                            <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-600 text-[11px] font-medium rounded-lg truncate max-w-[150px] shadow-sm">{f.name}</span>
                         ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={subiendoConsulta} className="w-full rounded-2xl text-white font-medium text-[16px] h-14 bg-gradient-to-r from-teal-400 to-emerald-400 disabled:opacity-50 mt-8 shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2">
                     {subiendoConsulta ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <><CheckCircle2 className="w-5 h-5"/> Guardar Expediente y Finalizar Cita</>}
                  </button>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       <AnimatePresence>
         {mostrarModalForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
               <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 w-full max-w-[500px] shadow-[0_20px_80px_rgba(252,133,95,0.25)] border border-[#fff4f1] relative my-8">
                  <button onClick={() => setMostrarModalForm(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-[#a0a0b2] hover:text-rose-500 transition-colors z-[350]"><X className="w-5 h-5"/></button>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#fc855f] rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/3 pointer-events-none"></div>
                  <div className="flex items-center gap-4 mb-8 relative z-10 pr-12">
                     <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-sm ${editandoId ? 'bg-teal-50' : 'bg-[#fff4f1]'}`}>
                        {editandoId ? <Pencil className="w-6 h-6 text-teal-400" /> : <CalendarIcon className="w-6 h-6 text-[#fc855f]" />}
                     </div>
                     <div>
                        <h3 className="text-[#3b3a62] font-medium text-2xl">{editandoId ? "Modificar Cita" : "Agendar Cita"}</h3>
                        <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Reserva un espacio en la clínica</p>
                     </div>
                  </div>
                  <form onSubmit={agendarOActualizarCita} className="space-y-6 relative z-10">
                     <div className="relative group overflow-visible">
                        <input type="text" required value={mascota} onChange={(e: any) => { setMascota(e.target.value); if(e.target.value.length > 1) setMostrarSugerencias(true); else setMostrarSugerencias(false); }} onFocus={() => {if(sugerenciasPacientes.length>0) setMostrarSugerencias(true)}} onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)} className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-medium text-[16px] pl-9" placeholder="Escribe para buscar mascota..." autoComplete="off" />
                        <PawPrint className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                        <AnimatePresence>
                           {mostrarSugerencias && sugerenciasPacientes.length > 0 && (
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-12 left-0 w-full bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_15px_40px_rgba(252,133,95,0.15)] border border-[#fff4f1] z-[120] overflow-hidden">
                                {sugerenciasPacientes.map(p => (
                                  <div key={p.id} onClick={() => {setMascota(p.nombre); setDueno(p.dueno); setMostrarSugerencias(false);}} className="px-4 py-3 cursor-pointer hover:bg-[#fff4f1]/80 border-b border-[#fff4f1]/50 last:border-0 flex items-center justify-between transition-colors">
                                     <div><p className="text-[#3b3a62] text-[14px] font-medium leading-none mb-1.5">{p.nombre}</p><p className="text-[#a0a0b2] text-[11px] font-light leading-none">Dueño: {p.dueno}</p></div>
                                     <span className="text-[10px] bg-[#fc855f]/10 text-[#fc855f] px-2 py-0.5 rounded-full font-medium">{p.especie || 'Mascota'}</span>
                                  </div>
                                ))}
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                     <div className="relative group">
                        <input type="text" required value={dueno} onChange={(e: any) => setDueno(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] text-[#fc855f] pl-9 text-[15px]" placeholder="Nombre Dueño" />
                        <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Fecha</label>
                           <input type="date" value={fecha} onChange={(e: any) => setFecha(e.target.value)} className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-[#fc855f] text-sm focus:ring-1 focus:ring-[#fc855f]/50" />
                        </div>
                        <div>
                           <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Hora</label>
                           <div className="flex bg-slate-50 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#fc855f]/50 border border-transparent">
                             <input type="number" min="1" max="12" value={horaSeleccionada} onChange={(e: any) => setHoraSeleccionada(e.target.value)} className="w-1/3 bg-transparent text-center focus:outline-none text-[#fc855f] text-sm h-11 pt-[2px]" />
                             <span className="py-2.5 text-[#a0a0b2]">:</span>
                             <input type="number" min="0" max="59" value={minutoSeleccionado} onChange={(e: any) => setMinutoSeleccionado(e.target.value)} className="w-1/3 bg-transparent text-center focus:outline-none text-[#fc855f] text-sm h-11 pt-[2px]" />
                             <select value={amPm} onChange={(e: any) => setAmPm(e.target.value)} className="w-1/3 bg-transparent text-[#fc855f] text-[11px] font-bold cursor-pointer h-11 pt-1"><option>AM</option><option>PM</option></select>
                           </div>
                        </div>
                     </div>
                     <div className="relative group mt-2">
                        <input type="text" required value={tipo} onChange={(e: any) => setTipo(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] text-[#fc855f] pl-9 text-[15px]" placeholder="Motivo de Consulta (Ej. Vacunación)" />
                        <Stethoscope className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                     </div>
                     <div className="relative group mt-6 bg-[#fff4f1]/30 p-4 rounded-xl border border-[#ffd1c3]/30">
                        <label className="text-[11px] uppercase tracking-wider text-[#fc855f] font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Condiciones / Notas</label>
                        <textarea value={notas} onChange={(e: any) => setNotas(e.target.value)} rows={3} className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#3b3a62] placeholder:text-[#c4c4c4] font-light text-[14px] resize-none" placeholder="Observaciones previas..." />
                     </div>
                     <button type="submit" disabled={enviando} className={`w-full rounded-2xl text-white font-medium text-[16px] h-14 transition-all mt-8 flex items-center justify-center gap-2 border border-white/20
                         ${editandoId ? 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_8px_20px_rgba(45,212,191,0.3)] hover:shadow-[0_12px_25px_rgba(45,212,191,0.4)]' : 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] shadow-[0_8px_20px_rgba(252,133,95,0.3)] hover:shadow-[0_12px_25px_rgba(252,133,95,0.4)]'} active:scale-95 disabled:opacity-70`}>
                        {enviando ? <Loader2 className="w-6 h-6 animate-spin" /> : editandoId ? "Actualizar Registro" : "Guardar Turno y Salir"}
                     </button>
                  </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACION DE ESTADO */}
      <AnimatePresence>
        {estadoAConfirmar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-[0_20px_80px_rgba(59,58,98,0.2)] border border-[#fcfcfd] text-center">
              <div className={`w-16 h-16 rounded-[1.2rem] mx-auto flex items-center justify-center mb-6 shadow-sm ${estadoAConfirmar.accion === 'Cancelada' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                {estadoAConfirmar.accion === 'Cancelada' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-medium text-[#3b3a62] mb-2">¿Marcar como {estadoAConfirmar.accion}?</h3>
              <p className="text-[14px] text-[#a0a0b2] font-light mb-8">Esta acción bloqueará el turno de <strong className="font-medium text-[#fc855f]">{estadoAConfirmar.mascota}</strong> y no podrás revertirlo.</p>
              <div className="flex gap-3">
                <button onClick={() => setEstadoAConfirmar(null)} className="flex-1 py-3.5 rounded-2xl font-medium text-[#a0a0b2] bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm">Volver</button>
                <button onClick={ejecutarCambioEstado} className={`flex-1 py-3.5 rounded-2xl font-medium text-white transition-all shadow-sm active:scale-95 ${estadoAConfirmar.accion === 'Cancelada' ? 'bg-rose-500 shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_20px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.4)]'}`}>Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR CITA */}
      <AnimatePresence>
        {citaAEliminar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-[0_20px_80px_rgba(59,58,98,0.2)] border border-[#fcfcfd] text-center">
               <div className="w-16 h-16 rounded-[1.2rem] bg-rose-50 border border-rose-100 mx-auto flex items-center justify-center mb-6 shadow-sm">
                 <Trash2 className="w-8 h-8 text-rose-500" />
               </div>
               <h3 className="text-xl font-medium text-[#3b3a62] mb-2">¿Eliminar turno?</h3>
               <p className="text-[14px] text-[#a0a0b2] font-light mb-8">Estás a punto de borrar definitivamente el turno de <strong className="font-medium text-[#fc855f]">{citaAEliminar.mascota}</strong>. Esto no se puede deshacer.</p>
               <div className="flex gap-3">
                 <button onClick={() => setCitaAEliminar(null)} className="flex-1 py-3.5 rounded-2xl font-medium text-[#a0a0b2] bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm">Cancelar</button>
                 <button onClick={eliminarCita} className="flex-1 py-3.5 rounded-2xl font-medium text-white bg-rose-500 transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_20px_rgba(244,63,94,0.4)] active:scale-95">Eliminar</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
