"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, Loader2, PawPrint, User, Stethoscope, ChevronDown, Trash2, Pencil, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Formulario Base
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mascota, setMascota] = useState("");
  const [dueno, setDueno] = useState("");
  const [tipo, setTipo] = useState("");

  // Estado del modal de confirmación de borrado
  const [citaAEliminar, setCitaAEliminar] = useState<any>(null);

  // Autocompletado de Mascota
  const [sugerenciasPacientes, setSugerenciasPacientes] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Estado del Selector de Fecha/Hora Femenino
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
    if (busqueda) {
      query = query.or(`mascota.ilike.%${busqueda}%,dueno.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`);
    }
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((paginaActual - 1) * POR_PAGINA, (paginaActual * POR_PAGINA) - 1);
    if (!error && data) {
      setCitas(data);
      setTotalCitas(count || 0);
    }
    setCargando(false);
  }

  const handleBuscador = (val: string) => {
    setBusqueda(val);
    setPaginaActual(1);
  };

  const handleMascotaChange = async (val: string) => {
    setMascota(val);
    if (!val || val.length < 2) {
      setSugerenciasPacientes([]);
      setMostrarSugerencias(false);
      return;
    }
    
    const { data } = await insforge.database
      .from("pacientes")
      .select("id, nombre, dueno, especie")
      .ilike("nombre", `%${val}%`)
      .limit(5);

    if (data && data.length > 0) {
      setSugerenciasPacientes(data);
      setMostrarSugerencias(true);
    } else {
      setMostrarSugerencias(false);
    }
  };

  const seleccionarPaciente = (p: any) => {
    setMascota(p.nombre);
    setDueno(p.dueno);
    setMostrarSugerencias(false);
  };

  const agendarOActualizarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const stringHora = `${horaSeleccionada}:${minutoSeleccionado} ${amPm}`;

    const datosCita = {
      mascota,
      dueno,
      fecha, 
      hora: stringHora,
      tipo,
      activa: true
    };

    if (editandoId) {
      const { data, error } = await insforge.database
        .from("citas")
        .update(datosCita)
        .eq("id", editandoId)
        .select();

      setEnviando(false);

      if (error) {
        toast.error("Error al actualizar la cita.");
        console.error(error);
      } else if (data) {
        toast.success("Cita actualizada elegantemente.", {
          style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#ecfeff', color: '#14b8a6', border: '1px solid #ccfbf1' }
        });
        cancelarEdicion();
        cargarCitas(); // Refrescar
      }
    } else {
      const { data, error } = await insforge.database.from("citas").insert([datosCita]).select();
      
      setEnviando(false);

      if (error) {
        toast.error("Hubo un error al agendar la cita.");
        console.error(error);
      } else if (data) {
        toast.success("¡Cita agendada elegantemente!", {
          style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#fc855f', color: 'white', border: 'none' }
        });
        cancelarEdicion();
        cargarCitas(); // Refrescar para aplicar la paginación correctamente
      }
    }
  };

  const iniciarEdicion = (cita: any) => {
    setEditandoId(cita.id);
    setMascota(cita.mascota || "");
    setDueno(cita.dueno || "");
    setTipo(cita.tipo || "");
    
    if (cita.fecha) setFecha(cita.fecha);
    if (cita.hora) {
      try {
        const [timePart, amPmPart] = cita.hora.split(" ");
        const [h, m] = timePart.split(":");
        if (h) setHoraSeleccionada(h);
        if (m) setMinutoSeleccionado(m);
        if (amPmPart) setAmPm(amPmPart);
      } catch (e) {
        console.warn("Could not parse time", cita.hora);
      }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mostrar el modal elegante
  const confirmarEliminacion = (cita: any) => {
    setCitaAEliminar(cita);
  };

  // Ejecución final del borrado tras confirmación
  const ejecutarEliminacion = async () => {
    if (!citaAEliminar) return;

    const id = citaAEliminar.id;
    const nombreMascota = citaAEliminar.mascota;
    const previousCitas = [...citas];
    
    // UX Optimista y cerrar modal
    setCitas(citas.filter(c => c.id !== id));
    setCitaAEliminar(null);

    const { error } = await insforge.database.from("citas").delete().eq("id", id);
    if (error) {
      toast.error("Error al revocar en la nube de Insforge.");
    } else {
      // Alerta minúscula bonita de éxito
      toast.success(`La cita de ${nombreMascota} fue eliminada.`, {
        icon: <Trash2 className="w-5 h-5 text-rose-500" />,
        style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#fff1f2', color: '#be123c', border: '1px solid #ffe4e6' }
      });
      cargarCitas(); // Refrescar totalmente para contar bien las páginas
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setMascota("");
    setDueno("");
    setTipo("");
    setMostrarPicker(false);
    setMostrarSugerencias(false);
  };

  const horas = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutos = ["00", "15", "30", "45"];

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-8 relative z-10"
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-10">
          <div>
            <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide">Gestión de Citas</h2>
            <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">Programa con elegancia los próximos turnos de tus pacientes peludos.</p>
          </div>
          <div className="relative group w-full lg:w-[320px]">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${busqueda ? 'text-[#fc855f]' : 'text-[#a0a0b2] group-hover:text-[#fc855f]'}`} />
            <input type="text" value={busqueda} onChange={(e) => handleBuscador(e.target.value)} placeholder="Buscar mascota, dueño o tipo..."
              className="w-full h-[52px] bg-white rounded-full border border border-[#fcfcfd] pl-12 pr-6 text-[14px] font-light text-[#3b3a62] placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#fc855f] focus:ring-1 focus:ring-[#fc855f]/20 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
            />
          </div>
        </div>
        
        {(() => {
           const totalPaginas = Math.ceil(totalCitas / POR_PAGINA);
           return (
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          
          {/* Lado Izquierdo: Formulario */}
          <div className="xl:col-span-1">
            <div className={`bg-white/80 backdrop-blur-lg rounded-[2rem] p-8 border ${editandoId ? 'border-teal-200 shadow-[0_8px_40px_rgba(20,184,166,0.15)]' : 'border-[#fcfcfd] shadow-[0_8px_40px_rgba(0,0,0,0.02)]'} relative overflow-visible transition-all duration-500`}>
              
              <div className={`absolute top-0 right-0 w-32 h-32 ${editandoId ? 'bg-teal-300' : 'bg-[#fc855f]'} rounded-full mix-blend-multiply filter blur-[60px] opacity-10 translate-x-1/3 -translate-y-1/3 pointer-events-none transition-colors duration-1000`}></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-[#3b3a62] font-medium text-lg flex items-center gap-2">
                  {editandoId ? <Pencil className="w-5 h-5 text-teal-400" /> : <Plus className="w-5 h-5 text-[#fc855f]" />}
                  {editandoId ? "Editando Turno" : "Agendar Cita"}
                </h3>
                
                {editandoId && (
                  <button type="button" onClick={cancelarEdicion} className="p-1.5 rounded-full text-[#a0a0b2] hover:bg-slate-100 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={agendarOActualizarCita} className="space-y-6 relative z-10 overflow-visible">
                <div className="relative group overflow-visible">
                  <input 
                    type="text" required value={mascota} onChange={(e) => handleMascotaChange(e.target.value)}
                    onFocus={() => {if(sugerenciasPacientes.length > 0) setMostrarSugerencias(true)}}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                    className="w-full h-10 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8 custom-autocomplete-input"
                    placeholder="Escribe para buscar mascota..."
                    autoComplete="off"
                  />
                  <PawPrint className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                  
                  <AnimatePresence>
                    {mostrarSugerencias && sugerenciasPacientes.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute top-12 left-0 w-full bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_15px_40px_rgba(252,133,95,0.15)] border border-[#fff4f1] z-[120] overflow-hidden"
                      >
                        {sugerenciasPacientes.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => seleccionarPaciente(p)}
                            className="px-4 py-3 cursor-pointer hover:bg-[#fff4f1]/80 border-b border-[#fff4f1]/50 last:border-0 flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="text-[#3b3a62] text-[14px] font-medium leading-none mb-1.5">{p.nombre}</p>
                              <p className="text-[#a0a0b2] text-[11px] font-light leading-none">Dueño: {p.dueno}</p>
                            </div>
                            <span className="text-[10px] bg-[#fc855f]/10 text-[#fc855f] px-2 py-0.5 rounded-full font-medium">{p.especie}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <input 
                    type="text" required value={dueno} onChange={(e) => setDueno(e.target.value)}
                    className="w-full h-10 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8"
                    placeholder="Nombre del Dueño"
                  />
                  <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                </div>

                {/* Selector de Fecha y Hora Premium */}
                <div className="relative group">
                  <div 
                    onClick={() => setMostrarPicker(!mostrarPicker)}
                    className="w-full h-10 bg-transparent border-b border-[#ffd1c3] hover:border-[#fc855f] transition-all cursor-pointer flex items-center pl-8 text-[#fc855f] font-light text-[15px]"
                  >
                    <Clock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                    {fecha ? `${fecha.split('-').reverse().join('/')}` : 'Fecha'} a las {horaSeleccionada}:{minutoSeleccionado} {amPm}
                    <ChevronDown className={`absolute right-0 w-4 h-4 text-[#fc855f]/50 transition-transform ${mostrarPicker ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {mostrarPicker && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-12 left-0 w-full md:w-[110%] bg-white rounded-3xl shadow-[0_20px_60px_rgba(252,133,95,0.15)] border border-[#fff4f1] p-5 z-[100] grid grid-cols-2 gap-4"
                      >
                        <div className="col-span-2">
                          <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Día de la Cita</label>
                          <input 
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full h-10 bg-[#fff4f1]/60 border-none rounded-xl px-4 text-[#fc855f] font-medium focus:outline-none focus:ring-2 focus:ring-[#fc855f]/20 text-sm cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Hora</label>
                          <div className="h-32 overflow-y-auto hide-scrollbar rounded-xl bg-[#fff4f1]/40 p-1 custom-scrollbar scroll-smooth">
                            {horas.map(h => (
                              <div 
                                key={h} 
                                onClick={() => setHoraSeleccionada(h)}
                                className={`py-2 px-3 text-center text-sm rounded-lg cursor-pointer transition-all ${horaSeleccionada === h ? 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white font-medium shadow-md shadow-[#fc855f]/30' : 'text-[#a0a0b2] hover:bg-white hover:text-[#fc855f]'}`}
                              >
                                {h}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Minuto</label>
                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#fff4f1]/40 p-1">
                              {minutos.map(m => (
                                <div 
                                  key={m} 
                                  onClick={() => setMinutoSeleccionado(m)}
                                  className={`py-2 text-center text-sm rounded-lg cursor-pointer transition-all ${minutoSeleccionado === m ? 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white font-medium shadow-md shadow-[#fc855f]/30' : 'text-[#a0a0b2] hover:bg-white hover:text-[#fc855f]'}`}
                                >
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-auto rounded-xl bg-[#fff4f1]/40 p-1 flex">
                            {['AM', 'PM'].map(p => (
                              <div 
                                key={p}
                                onClick={() => setAmPm(p)}
                                className={`flex-1 py-1.5 text-center text-xs cursor-pointer rounded-lg transition-all ${amPm === p ? 'bg-white text-[#fc855f] font-bold shadow-sm' : 'text-[#a0a0b2] hover:text-[#fc855f]'}`}
                              >
                                {p}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="col-span-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setMostrarPicker(false)}
                            className="w-full bg-white hover:bg-[#fff4f1] text-[#fc855f] border border-[#fff0eb] text-xs font-semibold uppercase tracking-wider py-3 rounded-xl transition-colors shadow-sm"
                          >
                            Confirmar Horario
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <input 
                    type="text" required value={tipo} onChange={(e) => setTipo(e.target.value)}
                    className="w-full h-10 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8"
                    placeholder="Motivo (Ej. Vacunación)"
                  />
                  <Stethoscope className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                </div>

                <button 
                  type="submit" disabled={enviando}
                  className={`w-full rounded-full text-white font-medium text-[15px] h-[46px] transition-all mt-6 flex items-center justify-center gap-2 ${editandoId ? 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_6px_14px_rgba(45,212,191,0.3)] hover:shadow-[0_8px_20px_rgba(45,212,191,0.25)]' : 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] shadow-[0_6px_14px_rgba(252,133,95,0.3)] hover:shadow-[0_8px_20px_rgba(252,133,95,0.25)]'} active:scale-95 disabled:opacity-70`}
                >
                  {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : editandoId ? "Actualizar Registro" : "Guardar Registro"}
                </button>
              </form>
            </div>
          </div>

          {/* Lado Derecho: Lista de Citas */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-[2rem] p-8 border border-[#fcfcfd] shadow-[0_8px_40px_rgba(0,0,0,0.02)] h-full min-h-[500px] flex flex-col relative overflow-hidden">
              {/* Floritura suave de fondo derecho */}
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

              <h3 className="text-[#3b3a62] font-light text-xl mb-6 flex items-center gap-2 relative z-10">
                <CalendarIcon className="w-5 h-5 text-[#a0a0b2]" />
                Programación de Turnos
                {cargando && <Loader2 className="w-4 h-4 animate-spin text-[#fc855f] ml-2" />}
              </h3>

              <div className="space-y-4 flex-1 relative z-10">
                <AnimatePresence>
                  {citas.map((cita, index) => (
                    <motion.div
                      key={cita.id}
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all group overflow-hidden ${editandoId === cita.id ? 'border-teal-200 bg-teal-50/20' : 'border-[#fcfcfd]'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full border border-[#ffe4dc] bg-[#fff4f1] flex items-center justify-center font-medium text-lg text-[#fc855f] group-hover:bg-[#fc855f] group-hover:text-white transition-all duration-300">
                          {cita.mascota ? cita.mascota[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <h5 className="text-[#3b3a62] font-medium text-[16px]">
                            {cita.mascota} <span className="text-[#a0a0b2] font-light text-sm ml-1">({cita.dueno})</span>
                          </h5>
                          <p className="text-[14px] text-[#a0a0b2] mt-1 font-light flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-[#fc855f]/60" /> {cita.tipo}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 flex items-center">
                        
                        <div className="flex flex-col sm:items-end gap-1 pr-6 group-hover:pr-5 transition-all outline-none border-r border-slate-100">
                          <div className={`text-[14px] font-medium px-5 py-2 rounded-full shadow-sm flex items-center gap-2 ${editandoId === cita.id ? 'text-teal-600 bg-teal-100' : 'text-[#fc855f] bg-[#fc855f]/10'}`}>
                            <Clock className="w-4 h-4" />
                            {cita.hora}
                          </div>
                          <div className="text-[12px] text-[#a0a0b2] font-light pr-2">
                            {cita.fecha ? cita.fecha.split('-').reverse().join('/') : 'Sin fecha'}
                          </div>
                        </div>

                        {/* Botones Flotantes de Edición/Borrado (Sutiles y elegantes) */}
                        <div className="pl-5 flex items-center gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => iniciarEdicion(cita)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-slate-50 hover:bg-teal-50 hover:text-teal-500 transition-colors shadow-sm"
                            title="Editar cita"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => confirmarEliminacion(cita)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-slate-50 hover:bg-rose-50 hover:text-rose-400 transition-colors shadow-sm"
                            title="Eliminar cita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {!cargando && citas.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="text-center p-12 text-[#a0a0b2] font-light italic"
                  >
                    La doctora Exotic no tiene citas. Usa el formulario para llenar su calendario.
                  </motion.div>
                )}

                {totalPaginas > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-12 mb-4">
                    <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#fff4f1] hover:text-[#fc855f] transition-all disabled:opacity-40"><ChevronLeft className="w-5 h-5 ml-0.5" /></button>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm">
                      {Array.from({length: totalPaginas}, (_, i) => i + 1).map(p => (<button key={p} onClick={() => setPaginaActual(p)} className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${paginaActual === p ? 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white shadow-md' : 'text-[#a0a0b2] hover:bg-[#fff4f1] hover:text-[#fc855f]'}`}>{p}</button>))}
                    </div>
                    <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#fff4f1] hover:text-[#fc855f] transition-all disabled:opacity-40"><ChevronRight className="w-5 h-5 mr-0.5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
        );
        })()}
      </motion.div>

      {/* MODAL MÁGICO Y DELICADO DE ELIMINACIÓN */}
      <AnimatePresence>
        {citaAEliminar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#3b3a62]/20 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] p-10 max-w-[320px] w-full shadow-[0_20px_60px_rgba(252,133,95,0.15)] border border-[#fff4f1] text-center relative overflow-hidden"
            >
              {/* Brillo suave de fondo rojizo */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100 rounded-full mix-blend-multiply filter blur-[50px] opacity-60 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6 relative z-10">
                <Trash2 className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-2xl font-light text-[#3b3a62] mb-3 tracking-wide relative z-10">
                ¿Eliminar Cita?
              </h3>
              
              <p className="text-[15px] font-light text-[#a0a0b2] mb-10 leading-relaxed relative z-10">
                Estás por cancelar definitivamente el turno de <strong className="text-[#3b3a62] font-medium">{citaAEliminar.mascota}</strong> a las {citaAEliminar.hora}.<br/><br/>¿Deseas continuar?
              </p>

              <div className="flex flex-col gap-3 w-full relative z-10">
                <button 
                  onClick={ejecutarEliminacion}
                  className="w-full py-3.5 px-4 rounded-xl text-rose-500 bg-rose-50 hover:bg-rose-100 font-medium text-sm transition-colors shadow-sm"
                >
                  Sí, borrarla
                </button>
                <button 
                  onClick={() => setCitaAEliminar(null)}
                  className="w-full py-3.5 px-4 rounded-xl text-[#a0a0b2] bg-white hover:bg-slate-50 border border-slate-100 font-medium text-sm transition-colors"
                >
                  Conservar turno
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
