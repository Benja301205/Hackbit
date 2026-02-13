Instrucciones de Rediseño Visual: Hackbit "Shadow Forest Edition"Este documento contiene las directrices para transformar la interfaz de Hackbit hacia una estética Aesthetic Modern / Dark Mode profundo.Objetivo: Cambiar exclusivamente el CSS y las clases de Tailwind para lograr un look de "App Premium" (Glassmorphism, negros puros y acentos verde esmeralda). NO se debe modificar la lógica de hooks, Supabase o navegación.1. Configuración de Base (src/index.css)Reemplazar o extender la configuración actual con estos valores de diseño:Fondo: #050505 (Negro puro).Acento: #10B981 (Emerald 500) con glow.Tarjetas: Glassmorphism (Fondo rgba(255,255,255,0.03), blur 12px, borde fino rgba(255,255,255,0.08)).Tipografía: Números y labels importantes en itálica y font-bold.Acción en src/index.css:@import "tailwindcss";

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --color-accent: #10B981;
}

body {
  background-color: #050505;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

/* Clases de utilidad Aesthetic */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
}

.btn-aesthetic {
  background: #10B981;
  color: #000;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  transition: all 0.3s ease;
}

.btn-aesthetic:active {
  transform: scale(0.95);
}
2. Modificaciones en Páginas (JSX)A. Dashboard.jsx (El Corazón de la App)Contenedor Principal: Cambiar el fondo del header de bg-emerald-500 a un fondo negro con un resplandor radial sutil: bg-transparent relative.Header: - El nombre del grupo debe ser text-3xl font-bold tracking-tight.Añadir un punto esmeralda al final: Hackbit<span className="text-emerald-500">.</span>.Secciones (Ranking, Hábitos, Actividad):Cambiar bg-white y shadow-sm por la clase glass-card.Los títulos de sección (h2) deben ser text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em].Ranking:El número de posición debe ser un círculo con borde sutil.Si el usuario es "Vos", usar text-emerald-500 y fuente itálica.Hábitos:Reemplazar los botones verdes estándar por la clase btn-aesthetic pero con tamaño reducido.Usar border-l-2 border-emerald-500/50 para resaltar hábitos completados.B. BottomNav.jsx (Navegación Flotante)Estructura: No debe ser una barra pegada al fondo de lado a lado.Estilo: Debe ser un contenedor flotante:Clases: fixed bottom-6 left-4 right-4 h-16 glass-card flex items-center justify-around z-50.Los iconos activos deben tener color text-emerald-500 y un resplandor sutil.C. Inicio.jsx (Landing)Fondo: Añadir un gradiente radial oscuro: bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)].Botones: - "Crear grupo" -> btn-aesthetic."Unirme" -> Fondo transparente, borde border-zinc-800, texto text-zinc-400.3. Detalles de Micro-diseñoInputs (CrearGrupo.jsx, UnirseGrupo.jsx):Fondo bg-zinc-900/50, borde border-white/5, texto text-white.Focus: border-emerald-500/50.Modales (FinDeRondaModal.jsx):Fondo de overlay: bg-black/80 backdrop-blur-md.Contenido: glass-card con padding extra y animación de escala.Badges de Estado:En lugar de fondos de colores sólidos, usar texto de color con un punto brillante (status-dot).Ejemplo: status-approved -> Punto verde esmeralda con shadow-[0_0_8px_#10B981].4. Check Final para la IA¿Se mantiene el español? Sí.¿Se cambiaron funciones? No, solo clases de Tailwind y estilos CSS.¿Es mobile-first? Sí, mantener el ancho máximo en contenedores grandes.¿Los contrastes son correctos? Sí, usar zinc-400 para textos secundarios sobre fondo negro para legibilidad.ß