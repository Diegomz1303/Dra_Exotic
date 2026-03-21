"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint, User, Phone, Plus, Loader2, Feather, Cat, Search, Trash2, Pencil, X, Hash, Leaf, Clock, MapPin, Bone, Activity, FileText, CheckCircle2, Stethoscope } from "lucide-react";
import { insforge } from "@/servicios/insforge";
import { toast } from "sonner";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const POR_PAGINA = 5;
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Estado del Nuevo Modal
  const [mostrarModalForm, setMostrarModalForm] = useState(false);

  // Estado de Historial Clínico
  const [modalHistorial, setModalHistorial] = useState<any>(null);
  const [citasHistorial, setCitasHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [limiteHistorial, setLimiteHistorial] = useState(5);
  const [tieneMasHistorial, setTieneMasHistorial] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);

  const abrirHistorial = async (paciente: any) => {
    setModalHistorial(paciente);
    setCitasHistorial([]);
    setLimiteHistorial(5);
    setCargandoHistorial(true);
    const { data, count } = await insforge.database.from("citas")
      .select("*", { count: 'exact' })
      .eq("mascota", paciente.nombre)
      .eq("estado", "Completada")
      .order("fecha", { ascending: false })
      .range(0, 4);
    
    if (data) {
      setCitasHistorial(data);
      if (count && count > 5) setTieneMasHistorial(true);
      else setTieneMasHistorial(false);
    }
    setCargandoHistorial(false);
  };

  const cargarMasHistorial = async () => {
    setCargandoMas(true);
    const nextLimit = limiteHistorial + 5;
    const { data, count } = await insforge.database.from("citas")
      .select("*", { count: 'exact' })
      .eq("mascota", modalHistorial.nombre)
      .eq("estado", "Completada")
      .order("fecha", { ascending: false })
      .range(0, nextLimit - 1);
    
    if (data) {
      setCitasHistorial(data);
      setLimiteHistorial(nextLimit);
      if (count && count > nextLimit) setTieneMasHistorial(true);
      else setTieneMasHistorial(false);
    }
    setCargandoMas(false);
  };

  // Formulario Común
  const [numeroHistorial, setNumeroHistorial] = useState("");
  const [nombre, setNombre] = useState("");
  const [especieTag, setEspecieTag] = useState("Perro");
  const [razaOEspecieDesc, setRazaOEspecieDesc] = useState(""); 
  const [dueno, setDueno] = useState("");
  const [telefono, setTelefono] = useState("");

  // Formulario Exóticos
  const [nombreCientifico, setNombreCientifico] = useState("");
  const [tiempoTenencia, setTiempoTenencia] = useState("");
  const [dieta, setDieta] = useState("");
  const [habitat, setHabitat] = useState("");

  const [pacienteAEliminar, setPacienteAEliminar] = useState<any | null>(null);

  useEffect(() => {
    const delay = setTimeout(() => { cargarPacientes(); }, 300);
    return () => clearTimeout(delay);
  }, [busqueda, paginaActual]);

  useEffect(() => { 
    if(!editandoId) generarHistorialRandom(); 
  }, [mostrarModalForm]);

  const generarHistorialRandom = () => {
    setNumeroHistorial(Math.floor(1000 + Math.random() * 9000).toString());
  };

  async function cargarPacientes() {
    setCargando(true);
    let query = insforge.database.from("pacientes").select('*', { count: 'exact' });
    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,dueno.ilike.%${busqueda}%,numero_historial.ilike.%${busqueda}%,nombre_cientifico.ilike.%${busqueda}%`);
    }
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((paginaActual - 1) * POR_PAGINA, (paginaActual * POR_PAGINA) - 1);
    if (!error && data) {
      setPacientes(data);
      setTotalPacientes(count || 0);
    }
    setCargando(false);
  }

  const handleBuscador = (val: string) => {
    setBusqueda(val);
    setPaginaActual(1);
  };

  const guardarExpediente = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const payload = { 
      numero_historial: numeroHistorial,
      nombre, 
      especie: especieTag, 
      raza: razaOEspecieDesc, 
      dueno, 
      telefono,
      nombre_cientifico: especieTag === 'Exótico' ? nombreCientifico : null,
      tiempo_tenencia: especieTag === 'Exótico' ? tiempoTenencia : null,
      dieta: especieTag === 'Exótico' ? dieta : null,
      habitat: especieTag === 'Exótico' ? habitat : null
    };

    if (editandoId) {
      const { data, error } = await insforge.database.from("pacientes").update(payload).eq("id", editandoId).select();
      setEnviando(false);
      
      if (error) {
        toast.error("Error al actualizar expediente.", { style: { background: '#fff0f0', color: '#fc855f' } });
      } else if (data) {
        toast.success("Expediente actualizado impecablemente.", {
          icon: <PawPrint className="w-5 h-5 text-white" />,
          style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#14b8a6', color: 'white', border: 'none' }
        });
        setPacientes(pacientes.map(p => p.id === editandoId ? data[0] : p));
        setMostrarModalForm(false);
        cancelarEdicion();
      }
    } else {
      const { data, error } = await insforge.database.from("pacientes").insert([payload]).select();
      setEnviando(false);

      if (error) {
        toast.error("Error al registrar paciente.");
      } else if (data) {
        // Alerta super bonita requerida por la dueña
        toast.success(`¡${nombre} se agregó exitosamente!`, {
          icon: <PawPrint className="w-5 h-5 text-white" />,
          style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#fc855f', color: 'white', border: 'none', boxShadow: '0 8px 30px rgba(252,133,95,0.4)' }
        });
        setPacientes([data[0], ...pacientes]);
        setMostrarModalForm(false);
        cancelarEdicion();
      }
    }
  };

  const iniciarEdicion = (p: any) => {
    setEditandoId(p.id);
    setNumeroHistorial(p.numero_historial || Math.floor(1000 + Math.random() * 9000).toString());
    setNombre(p.nombre || "");
    setEspecieTag(p.especie || "Perro");
    setRazaOEspecieDesc(p.raza || "");
    setDueno(p.dueno || "");
    setTelefono(p.telefono || "");
    setNombreCientifico(p.nombre_cientifico || "");
    setTiempoTenencia(p.tiempo_tenencia || "");
    setDieta(p.dieta || "");
    setHabitat(p.habitat || "");
    setMostrarModalForm(true); // Abre el modal en modo edición
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    generarHistorialRandom();
    setNombre(""); setRazaOEspecieDesc(""); setDueno(""); setTelefono("");
    setNombreCientifico(""); setTiempoTenencia(""); setDieta(""); setHabitat("");
    setEspecieTag("Perro");
  };

  const ejecutarEliminacion = async () => {
    if (!pacienteAEliminar) return;

    const id = pacienteAEliminar.id;
    const nombreM = pacienteAEliminar.nombre;
    const previous = [...pacientes];
    
    setPacientes(pacientes.filter(p => p.id !== id));
    setPacienteAEliminar(null);

    const { error } = await insforge.database.from("pacientes").delete().eq("id", id);
    if (error) {
      setPacientes(previous); 
      toast.error("Error al revocar en la base de datos.");
    } else {
      toast.success(`El expediente de ${nombreM} fue eliminado.`, {
        icon: <Trash2 className="w-5 h-5 text-rose-500" />,
        style: { borderRadius: '100px', padding: '16px', fontSize: '14px', background: '#fff1f2', color: '#be123c', border: '1px solid #ffe4e6' }
      });
    }
  };

  const totalPaginas = Math.ceil(totalPacientes / POR_PAGINA);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Cabecera y Boton Principal */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-10">
          <div>
            <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide">Directorio de Pacientes</h2>
            <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">Administra el expediente e historial clínico de los peludos.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative group w-full md:w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b2] group-hover:text-[#fc855f] transition-colors" />
              <input type="text" value={busqueda} onChange={(e) => handleBuscador(e.target.value)} placeholder="Buscar ID, nombre o dueño..."
                className="w-full h-[52px] bg-white rounded-full border border border-[#fcfcfd] pl-12 pr-6 text-[14px] font-light text-[#3b3a62] placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#fc855f] focus:ring-1 focus:ring-[#fc855f]/20 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
              />
            </div>

            <button 
              onClick={() => { cancelarEdicion(); setMostrarModalForm(true); }}
              className="w-full md:w-auto whitespace-nowrap bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white px-8 h-[52px] rounded-full font-medium text-[15px] shadow-[0_6px_14px_rgba(252,133,95,0.3)] hover:shadow-[0_8px_25px_rgba(252,133,95,0.25)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Añadir Paciente
            </button>
          </div>
        </div>

        {/* Listado Grid a Pantalla Completa (Mucho más ordenado) */}
        <div className="bg-transparent min-h-[500px]">
          {cargando ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-[#a0a0b2] space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#fc855f]/50" />
              <p className="font-light text-sm italic">Consultando archivo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
              <AnimatePresence>
                {pacientes.map((paciente, index) => (
                  <motion.div
                    key={paciente.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}
                    className={`bg-white rounded-[1.5rem] p-6 border shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-all group relative flex flex-col h-full ${editandoId === paciente.id ? 'border-teal-200 bg-teal-50/20' : 'border-[#fcfcfd]'}`}
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                       <button onClick={() => abrirHistorial(paciente)} className="w-8 h-8 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Ver Expediente Médico">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => iniciarEdicion(paciente)} className="w-8 h-8 rounded-full flex items-center justify-center text-teal-300 hover:bg-teal-50 hover:text-teal-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setPacienteAEliminar(paciente)} className="w-8 h-8 rounded-full flex items-center justify-center text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-[1rem] flex items-center justify-center font-medium text-xl shadow-sm shrink-0
                        ${paciente.especie === 'Gato' ? 'bg-blue-50 text-blue-400' : 
                          paciente.especie === 'Ave' ? 'bg-emerald-50 text-emerald-400' : 
                          'bg-[#fff4f1] text-[#fc855f]'}`}
                      >
                        {paciente.especie === 'Gato' ? <Cat className="w-6 h-6" /> : paciente.especie === 'Ave' ? <Feather className="w-6 h-6" /> : paciente.especie === 'Exótico' ? <Leaf className="w-6 h-6" /> : <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${paciente.nombre}&backgroundColor=transparent`} className="w-8 h-8 invert opacity-80" alt="avatar" /> }
                      </div>
                      <div className="min-w-0 pr-8">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[#3b3a62] font-semibold text-lg truncate max-w-full">{paciente.nombre}</h4>
                          {paciente.numero_historial && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-mono font-bold tracking-widest border border-slate-200">
                              #{paciente.numero_historial}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#a0a0b2] font-light truncate w-full">
                          {paciente.especie === 'Exótico' && paciente.nombre_cientifico ? 
                            <span className="italic">({paciente.nombre_cientifico})</span> : 
                            (paciente.raza || paciente.especie)}
                        </p>
                      </div>
                    </div>

                    {paciente.especie === 'Exótico' && (
                      <div className="mb-4 bg-[#fff4f1]/50 border border-[#ffd1c3]/50 rounded-xl p-3 space-y-2 shrink-0">
                        <p className="text-[11px] text-[#a0a0b2] uppercase tracking-wider font-semibold border-b border-[#ffd1c3]/50 pb-1 mb-2">Ficha Técnica • {paciente.raza || '-'}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[#3b3a62]">
                          <div><strong className="block text-[#fc855f] font-semibold text-[10px] uppercase">Dieta</strong><span className="truncate block max-w-full" title={paciente.dieta}>{paciente.dieta || '-'}</span></div>
                          <div><strong className="block text-[#fc855f] font-semibold text-[10px] uppercase">Hábitat</strong><span className="truncate block max-w-full" title={paciente.habitat}>{paciente.habitat || '-'}</span></div>
                          <div className="col-span-2"><strong className="block text-[#fc855f] font-semibold text-[10px] uppercase">En familia desde: </strong>{paciente.tiempo_tenencia || '-'}</div>
                        </div>
                      </div>
                    )}

                    <div className={`space-y-3 pt-4 border-t ${paciente.especie === 'Exótico' ? 'border-[#ffd1c3]/30' : 'border-slate-50'} mt-auto`}>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0"><User className="w-3 h-3 text-[#a0a0b2]" /></div>
                        <span className="text-[14px] text-[#3b3a62] font-light truncate">{paciente.dueno}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0"><Phone className="w-3 h-3 text-[#a0a0b2]" /></div>
                        <span className="text-[14px] text-[#3b3a62] font-light truncate">{paciente.telefono}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12 mb-4 col-span-full flex-wrap">
              <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#fff4f1] hover:text-[#fc855f] transition-all disabled:opacity-40">&lt;</button>
              <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm">
                {Array.from({length: totalPaginas}, (_, i) => i + 1).map(p => (<button key={p} onClick={() => setPaginaActual(p)} className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${paginaActual === p ? 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] text-white shadow-md' : 'text-[#a0a0b2] hover:bg-[#fff4f1] hover:text-[#fc855f]'}`}>{p}</button>))}
              </div>
              <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#fff4f1] hover:text-[#fc855f] transition-all disabled:opacity-40">&gt;</button>
            </div>
          )}
          {!cargando && pacientes.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 text-[#a0a0b2] font-light italic col-span-full mt-10">
              {busqueda ? "No se encontraron mascotas que coincidan con la búsqueda." : "No tienes mascotas registradas. Agrégalas tocando el botón."}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* MODAL DE DIBUJO ELEGANTISIMO PARA FORMULARIO */}
      <AnimatePresence>
        {mostrarModalForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_80px_rgba(252,133,95,0.25)] border border-[#fff4f1] relative my-8"
            >
              {/* Botón Cerrar (X) Flotante fuera del contenido alineado a la derecha */}
              <button 
                onClick={() => setMostrarModalForm(false)} 
                className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-[#a0a0b2] hover:text-rose-500 transition-colors z-[350]"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>

              <div className="absolute top-0 right-0 w-64 h-64 bg-[#fc855f] rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/3 pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-8 relative z-10 pr-12">
                <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-sm ${editandoId ? 'bg-teal-50' : 'bg-[#fff4f1]'}`}>
                  {editandoId ? <Pencil className="w-6 h-6 text-teal-400" /> : <PawPrint className="w-6 h-6 text-[#fc855f]" />}
                </div>
                <div>
                  <h3 className="text-[#3b3a62] font-medium text-2xl">
                    {editandoId ? "Editar Expediente" : "Nuevo Expediente"}
                  </h3>
                  <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Ingresa los datos con cuidado</p>
                </div>
              </div>

              <form onSubmit={guardarExpediente} className="space-y-6 relative z-10">
                <div className="relative group">
                  <input type="text" required value={numeroHistorial} onChange={(e) => setNumeroHistorial(e.target.value)}
                    className="w-full h-11 bg-[#fff4f1]/50 focus:bg-transparent rounded-xl border border-transparent focus:border-[#fc855f] transition-all text-[#fc855f] font-medium text-[15px] pl-10 pr-4 outline-none shadow-sm shadow-[#fc855f]/5" placeholder="N. Historial (Ej. 1024)" />
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/60" />
                  <span className="absolute top-[-10px] left-2 bg-gradient-to-t from-white to-transparent px-1 text-[10px] text-[#a0a0b2] font-semibold tracking-wider font-mono">ID HISTORIAL</span>
                </div>

                <div className="border-b border-[#ffd1c3]/50 pb-6 pt-3">
                  <p className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-3 ml-1">Especie</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Perro', 'Gato', 'Ave', 'Exótico'].map(esp => (
                      <div key={esp} onClick={() => setEspecieTag(esp)}
                        className={`flex-1 py-2.5 text-center text-[13px] cursor-pointer rounded-xl transition-all border ${especieTag === esp ? 'bg-[#fc855f] border-[#fc855f] text-white font-medium shadow-[0_6px_15px_rgba(252,133,95,0.3)] scale-[1.02]' : 'bg-slate-50/50 border-slate-100 text-[#a0a0b2] hover:bg-white hover:border-[#ffd1c3] hover:text-[#fc855f]'}`}>
                        {esp}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder={`Nombre ${especieTag === 'Exótico' ? 'del animal' : '(Ej. Luna)'}`} />
                  <PawPrint className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                </div>

                <AnimatePresence mode="popLayout">
                  {especieTag === 'Exótico' ? (
                    <motion.div key="exotic" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                      <div className="relative group">
                        <input type="text" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)}
                          className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="Nombre Científico (Opcional)" />
                        <Leaf className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                      </div>
                      <div className="relative group">
                        <input type="text" required value={razaOEspecieDesc} onChange={(e) => setRazaOEspecieDesc(e.target.value)}
                          className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="Especie exacta (Ej. Serpiente)" />
                        <Activity className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                      </div>
                      <div className="relative group">
                        <input type="text" required value={tiempoTenencia} onChange={(e) => setTiempoTenencia(e.target.value)}
                          className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="¿Desde cuándo lo tienen?" />
                        <Clock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                      </div>
                      <div className="relative group">
                        <input type="text" required value={dieta} onChange={(e) => setDieta(e.target.value)}
                          className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="¿Cuál es su Dieta?" />
                        <Bone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                      </div>
                      <div className="relative group">
                        <input type="text" required value={habitat} onChange={(e) => setHabitat(e.target.value)}
                          className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="Hábitat / Terrario (Ej. Foco UV)" />
                        <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fc855f]/50" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="common" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                      <div className="relative group">
                        <input type="text" value={razaOEspecieDesc} onChange={(e) => setRazaOEspecieDesc(e.target.value)}
                          className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="Raza (Opcional)" />
                        <Activity className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2 space-y-6">
                  <div className="relative group">
                    <input type="text" required value={dueno} onChange={(e) => setDueno(e.target.value)}
                      className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="Familia / Dueño responsable" />
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                  </div>
                  <div className="relative group">
                    <input type="text" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                      className="w-full h-11 bg-transparent border-b border-[#ffd1c3] focus:outline-none focus:border-[#fc855f] transition-all text-[#fc855f] placeholder:text-[#c4c4c4] font-light text-[15px] pl-8" placeholder="Celular de Contacto" />
                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fc855f]/50" />
                  </div>
                </div>

                <button 
                  type="submit" disabled={enviando}
                  className={`w-full rounded-2xl text-white font-medium text-[16px] h-14 transition-all mt-8 flex items-center justify-center gap-2 
                    ${editandoId ? 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_8px_20px_rgba(45,212,191,0.3)] hover:shadow-[0_12px_25px_rgba(45,212,191,0.4)]' 
                    : 'bg-gradient-to-r from-[#fc855f] to-[#ff9770] shadow-[0_8px_20px_rgba(252,133,95,0.3)] hover:shadow-[0_12px_25px_rgba(252,133,95,0.4)]'} active:scale-95 disabled:opacity-70 border border-white/20`}
                >
                  {enviando ? <Loader2 className="w-6 h-6 animate-spin" /> : editandoId ? "Finalizar Edición" : "Guardar Expediente y Salir"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Eliminar */}
      <AnimatePresence>
        {pacienteAEliminar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-[#3b3a62]/20 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white rounded-[2rem] p-10 max-w-[320px] w-full shadow-[0_20px_60px_rgba(252,133,95,0.15)] border border-[#fff4f1] text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100 rounded-full mix-blend-multiply filter blur-[50px] opacity-60 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6 relative z-10"><Trash2 className="w-8 h-8 text-rose-400" strokeWidth={1.5} /></div>
              <h3 className="text-2xl font-light text-[#3b3a62] mb-3 tracking-wide relative z-10">¿Borrar Paciente?</h3>
              <p className="text-[15px] font-light text-[#a0a0b2] mb-10 leading-relaxed relative z-10">
                Estás por cancelar definitivamente el archivo médico de <strong className="text-[#3b3a62] font-medium">{pacienteAEliminar.nombre}</strong>.<br/><br/>¿Deseas continuar?
              </p>
              <div className="flex flex-col gap-3 w-full relative z-10">
                <button onClick={ejecutarEliminacion} className="w-full py-3.5 px-4 rounded-xl text-rose-500 bg-rose-50 hover:bg-rose-100 font-medium text-sm transition-colors shadow-sm">Sí, borrar</button>
                <button onClick={() => setPacienteAEliminar(null)} className="w-full py-3.5 px-4 rounded-xl text-[#a0a0b2] bg-white hover:bg-slate-50 border border-slate-100 font-medium text-sm transition-colors">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal Historial */}
      <AnimatePresence>
        {modalHistorial && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full h-[85vh] md:h-[80vh] flex flex-col shadow-[0_30px_100px_rgba(59,58,98,0.2)] border border-[#fcfcfd] relative overflow-hidden">
               <button onClick={() => setModalHistorial(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-[#a0a0b2] hover:text-rose-500 transition-colors z-[600]"><X className="w-5 h-5"/></button>
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/3 pointer-events-none"></div>

               <div className="flex items-center gap-4 mb-8 shrink-0 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                   <FileText className="w-6 h-6 text-blue-500" />
                 </div>
                 <div>
                   <h3 className="text-[#3b3a62] font-medium text-2xl">Expediente Clínico</h3>
                   <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Historial médico de <strong className="text-blue-500 font-medium">{modalHistorial.nombre}</strong></p>
                 </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative z-10">
                  {cargandoHistorial ? (
                     <div className="flex flex-col items-center justify-center h-40 text-[#a0a0b2]"><Loader2 className="w-8 h-8 animate-spin text-blue-400 opacity-50 mb-3"/> Buscando archivos...</div>
                  ) : citasHistorial.length === 0 ? (
                     <div className="text-center p-12 text-[#a0a0b2] font-light italic">No hay registros completados para este paciente.</div>
                  ) : (
                     <div className="border-l-2 border-slate-100/60 ml-4 pl-6 space-y-10 py-4">
                        {citasHistorial.map((cita) => (
                           <div key={cita.id} className="relative group">
                              <div className="absolute -left-[35px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-blue-400 group-hover:scale-125 transition-transform shadow-sm"></div>
                              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.03)] transition-all">
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="text-[12px] font-bold text-[#a0a0b2] uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{cita.fecha.split('-').reverse().join('/')} a las {cita.hora.split(' ')[0]}</div>
                                    <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Cita OK</div>
                                 </div>
                                 <h4 className="text-[#3b3a62] font-medium text-lg mb-4 flex items-center gap-2 border-b border-slate-50 pb-4"><Stethoscope className="w-4 h-4 text-blue-400"/> {cita.tipo}</h4>
                                 
                                 {cita.diagnostico && (
                                   <div className="mb-4">
                                     <h5 className="text-[11px] font-bold text-[#a0a0b2] uppercase tracking-wider mb-1.5">Diagnóstico Médico</h5>
                                     <p className="text-[14px] leading-relaxed text-[#3b3a62] font-light bg-slate-50 p-4 rounded-xl border border-slate-100/50">{cita.diagnostico}</p>
                                   </div>
                                 )}
                                 
                                 {cita.tratamiento && (
                                   <div className="mb-5">
                                     <h5 className="text-[11px] font-bold text-[#a0a0b2] uppercase tracking-wider mb-1.5">Tratamiento / Receta</h5>
                                     <p className="text-[14px] leading-relaxed text-[#3b3a62] font-light bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">{cita.tratamiento}</p>
                                   </div>
                                 )}

                                 {(cita.archivos && cita.archivos.length > 0) && (
                                   <div className="pt-2 border-t border-slate-50">
                                     <h5 className="text-[11px] font-bold text-[#a0a0b2] uppercase tracking-wider mb-3">Archivos Adjuntos (PDFs / Análisis)</h5>
                                     <div className="flex flex-wrap gap-2">
                                       {cita.archivos.map((arc: any, idx: number) => {
                                          const urlPublica = arc.url?.startsWith('http') ? arc.url : `${process.env.NEXT_PUBLIC_INSFORGE_URL}/storage/v1/object/public/historial/${arc.url || arc.key}`;
                                          return (
                                            <a key={idx} href={urlPublica} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-100/50 hover:border-blue-200 text-[12px] font-medium rounded-xl flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
                                               {arc.tipo && arc.tipo.includes('pdf') ? <FileText className="w-4 h-4"/> : <Activity className="w-4 h-4"/>}
                                               {arc.nombre || `Documento ${idx+1}`}
                                            </a>
                                          )
                                       })}
                                     </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                        ))}
                        {tieneMasHistorial && (
                           <div className="pt-4 flex justify-center">
                              <button onClick={cargarMasHistorial} disabled={cargandoMas} className="bg-white border border-slate-200 text-[#a0a0b2] font-medium text-[13px] px-6 py-2.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                                 {cargandoMas ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                                 Cargar expedientes anteriores
                              </button>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
