-- ============================================================
-- WhatsApp Clinic Dashboard
-- Supabase Database Schema
-- ============================================================
-- Clínica Dietética y Estética Dr. Sergio
-- Sistema de gestión de pacientes vía WhatsApp con IA
-- ============================================================
-- Execute this SQL in Supabase SQL Editor to set up the database.
-- ============================================================

-- ==========================
-- 0. CLEANUP (safe for fresh installs)
-- ==========================
DROP VIEW IF EXISTS public.v_informe_kpis CASCADE;
DROP VIEW IF EXISTS public.v_pacientes_pendientes CASCADE;
DROP VIEW IF EXISTS public.v_citas_hoy CASCADE;

DROP TABLE IF EXISTS public.tareas_noelia CASCADE;
DROP TABLE IF EXISTS public.mensajes_chat CASCADE;
DROP TABLE IF EXISTS public.sesiones_chat CASCADE;
DROP TABLE IF EXISTS public.notas_paciente CASCADE;
DROP TABLE IF EXISTS public.interacciones CASCADE;
DROP TABLE IF EXISTS public.citas CASCADE;
DROP TABLE IF EXISTS public.informe_pacientes CASCADE;
DROP TABLE IF EXISTS public.informes_diarios CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
DROP TABLE IF EXISTS public.configuracion CASCADE;

DROP TYPE IF EXISTS public.estado_cita CASCADE;
DROP TYPE IF EXISTS public.tipo_paciente CASCADE;
DROP TYPE IF EXISTS public.prioridad_tarea CASCADE;
DROP TYPE IF EXISTS public.estado_tarea CASCADE;
DROP TYPE IF EXISTS public.categoria_informe CASCADE;
DROP TYPE IF EXISTS public.origen_interaccion CASCADE;

-- ==========================
-- 1. ENUM TYPES
-- ==========================
CREATE TYPE public.estado_cita AS ENUM (
  'confirmada',
  'pendiente',
  'cancelada',
  'no_acude',
  'completada',
  'reagendada'
);

CREATE TYPE public.tipo_paciente AS ENUM (
  'dietetica',
  'estetica',
  'ambos',
  'nuevo'
);

CREATE TYPE public.prioridad_tarea AS ENUM (
  'urgente',
  'alta',
  'media',
  'baja'
);

CREATE TYPE public.estado_tarea AS ENUM (
  'pendiente',
  'en_proceso',
  'completada'
);

CREATE TYPE public.categoria_informe AS ENUM (
  'urgente',
  'pendiente',
  'confirmado',
  'no_acude'
);

CREATE TYPE public.origen_interaccion AS ENUM (
  'whatsapp',
  'llamada',
  'presencial',
  'email',
  'sistema'
);

-- ==========================
-- 2. TRIGGER FUNCTION: auto-update updated_at
-- ==========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================
-- 3. TABLE: pacientes
-- ==========================
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT,
  telefono TEXT NOT NULL,
  email TEXT,
  tipo public.tipo_paciente NOT NULL DEFAULT 'nuevo',
  fecha_nacimiento DATE,
  notas_internas TEXT,
  alergias TEXT[],
  tratamientos_activos TEXT[],
  whatsapp_id TEXT, -- Evolution API contact ID
  avatar_url TEXT,
  activo BOOLEAN DEFAULT true,
  cancelaciones_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_pacientes_telefono ON public.pacientes(telefono);
CREATE INDEX idx_pacientes_nombre ON public.pacientes(nombre);
CREATE INDEX idx_pacientes_tipo ON public.pacientes(tipo);
CREATE INDEX idx_pacientes_whatsapp_id ON public.pacientes(whatsapp_id);

-- ==========================
-- 4. TABLE: citas
-- ==========================
CREATE TABLE public.citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  duracion_minutos INTEGER DEFAULT 30,
  tipo public.tipo_paciente NOT NULL DEFAULT 'dietetica',
  estado public.estado_cita NOT NULL DEFAULT 'pendiente',
  motivo TEXT,
  notas TEXT,
  confirmada_por TEXT, -- 'whatsapp', 'llamada', 'manual'
  confirmada_at TIMESTAMPTZ,
  cancelacion_motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_citas_updated_at
  BEFORE UPDATE ON public.citas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_citas_paciente_id ON public.citas(paciente_id);
CREATE INDEX idx_citas_fecha ON public.citas(fecha);
CREATE INDEX idx_citas_estado ON public.citas(estado);
CREATE INDEX idx_citas_fecha_estado ON public.citas(fecha, estado);

-- ==========================
-- 5. TABLE: interacciones (conversaciones WhatsApp)
-- ==========================
CREATE TABLE public.interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  origen public.origen_interaccion NOT NULL DEFAULT 'whatsapp',
  mensaje_original TEXT, -- raw message from WhatsApp
  resumen_ia TEXT, -- Claude Haiku summary
  categoria public.categoria_informe,
  accion_requerida TEXT,
  etiquetas TEXT[],
  whatsapp_message_id TEXT, -- Evolution API message ID
  procesado BOOLEAN DEFAULT false,
  procesado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interacciones_paciente_id ON public.interacciones(paciente_id);
CREATE INDEX idx_interacciones_fecha ON public.interacciones(created_at DESC);
CREATE INDEX idx_interacciones_categoria ON public.interacciones(categoria);
CREATE INDEX idx_interacciones_procesado ON public.interacciones(procesado);

-- ==========================
-- 6. TABLE: informes_diarios
-- ==========================
CREATE TABLE public.informes_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  total_conversaciones INTEGER DEFAULT 0,
  total_pacientes INTEGER DEFAULT 0,
  total_confirmados INTEGER DEFAULT 0,
  total_cancelaciones INTEGER DEFAULT 0,
  total_pendientes INTEGER DEFAULT 0,
  total_urgentes INTEGER DEFAULT 0,
  resumen_ejecutivo TEXT, -- Claude-generated executive summary
  puntos_clave TEXT[], -- bullet points
  generado_at TIMESTAMPTZ DEFAULT now(),
  datos_raw JSONB, -- raw data for regeneration
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_informes_fecha ON public.informes_diarios(fecha DESC);

-- ==========================
-- 7. TABLE: informe_pacientes (detail per patient per report)
-- ==========================
CREATE TABLE public.informe_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id UUID NOT NULL REFERENCES public.informes_diarios(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  categoria public.categoria_informe NOT NULL,
  descripcion TEXT,
  accion_requerida TEXT,
  etiquetas TEXT[],
  hora_cita TIME,
  motivo_cancelacion TEXT,
  reagendado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_informe_pacientes_informe ON public.informe_pacientes(informe_id);
CREATE INDEX idx_informe_pacientes_categoria ON public.informe_pacientes(categoria);

-- ==========================
-- 8. TABLE: tareas_noelia
-- ==========================
CREATE TABLE public.tareas_noelia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id UUID REFERENCES public.informes_diarios(id) ON DELETE SET NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad public.prioridad_tarea NOT NULL DEFAULT 'media',
  estado public.estado_tarea NOT NULL DEFAULT 'pendiente',
  orden INTEGER DEFAULT 0,
  completada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_tareas_updated_at
  BEFORE UPDATE ON public.tareas_noelia
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_tareas_estado ON public.tareas_noelia(estado);
CREATE INDEX idx_tareas_prioridad ON public.tareas_noelia(prioridad);
CREATE INDEX idx_tareas_informe ON public.tareas_noelia(informe_id);

-- ==========================
-- 9. TABLE: notas_paciente
-- ==========================
CREATE TABLE public.notas_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  autor TEXT DEFAULT 'Noelia', -- who wrote the note
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notas_paciente ON public.notas_paciente(paciente_id);

-- ==========================
-- 10. TABLE: sesiones_chat (chat interrogator sessions)
-- ==========================
CREATE TABLE public.sesiones_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contexto TEXT, -- 'informe_2025-02-03', 'paciente_uuid', etc.
  titulo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_sesiones_chat_updated_at
  BEFORE UPDATE ON public.sesiones_chat
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================
-- 11. TABLE: mensajes_chat
-- ==========================
CREATE TABLE public.mensajes_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES public.sesiones_chat(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  contenido TEXT NOT NULL,
  tokens_usados INTEGER,
  modelo TEXT DEFAULT 'claude-sonnet',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mensajes_sesion ON public.mensajes_chat(sesion_id);
CREATE INDEX idx_mensajes_fecha ON public.mensajes_chat(created_at);

-- ==========================
-- 12. TABLE: configuracion
-- ==========================
CREATE TABLE public.configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_configuracion_updated_at
  BEFORE UPDATE ON public.configuracion
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================
-- 13. VIEWS
-- ==========================

-- v_citas_hoy: Today's appointments with patient info
CREATE OR REPLACE VIEW public.v_citas_hoy AS
SELECT
  c.id AS cita_id,
  c.fecha,
  c.hora,
  c.estado,
  c.tipo,
  c.motivo,
  p.id AS paciente_id,
  p.nombre,
  p.apellidos,
  p.telefono,
  p.tipo AS tipo_paciente,
  p.cancelaciones_total
FROM public.citas c
JOIN public.pacientes p ON p.id = c.paciente_id
WHERE c.fecha = CURRENT_DATE
ORDER BY c.hora;

-- v_pacientes_pendientes: Patients with pending actions
CREATE OR REPLACE VIEW public.v_pacientes_pendientes AS
SELECT
  p.id,
  p.nombre,
  p.apellidos,
  p.telefono,
  p.tipo,
  COUNT(DISTINCT c.id) FILTER (WHERE c.estado = 'pendiente' AND c.fecha >= CURRENT_DATE) AS citas_pendientes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'pendiente') AS tareas_pendientes,
  MAX(i.created_at) AS ultima_interaccion
FROM public.pacientes p
LEFT JOIN public.citas c ON c.paciente_id = p.id
LEFT JOIN public.tareas_noelia t ON t.paciente_id = p.id
LEFT JOIN public.interacciones i ON i.paciente_id = p.id
WHERE p.activo = true
GROUP BY p.id, p.nombre, p.apellidos, p.telefono, p.tipo
HAVING COUNT(DISTINCT c.id) FILTER (WHERE c.estado = 'pendiente' AND c.fecha >= CURRENT_DATE) > 0
    OR COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'pendiente') > 0
ORDER BY tareas_pendientes DESC, citas_pendientes DESC;

-- v_informe_kpis: KPIs for the daily report
CREATE OR REPLACE VIEW public.v_informe_kpis AS
SELECT
  i.fecha,
  i.total_conversaciones,
  i.total_pacientes,
  i.total_confirmados,
  i.total_cancelaciones,
  i.total_pendientes,
  i.total_urgentes,
  (SELECT COUNT(*) FROM public.tareas_noelia t
   WHERE t.informe_id = i.id AND t.estado = 'pendiente') AS tareas_pendientes_noelia,
  i.generado_at
FROM public.informes_diarios i
ORDER BY i.fecha DESC;

-- ==========================
-- 14. SEED DATA
-- ==========================
DO $$
DECLARE
  v_paciente_elena UUID;
  v_paciente_rafael UUID;
  v_paciente_francisca UUID;
  v_paciente_francisco UUID;
  v_paciente_carmen UUID;
  v_paciente_mercedes UUID;
  v_paciente_irene UUID;
  v_paciente_silvia UUID;
  v_paciente_eva UUID;
  v_paciente_antonio UUID;
  v_paciente_laura UUID;
  v_paciente_jose UUID;
  v_paciente_ana UUID;
  v_paciente_pedro UUID;
  v_paciente_yolanda UUID;
  v_informe_id UUID;
BEGIN

  -- --------------------------------------------------------
  -- SEED: Pacientes
  -- --------------------------------------------------------
  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Elena', 'Aguado', '+34 612 345 001', 'dietetica', 'Paciente habitual. Seguimiento peso mensual.', 3)
  RETURNING id INTO v_paciente_elena;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Rafael', 'Sánchez', '+34 612 345 002', 'dietetica', 'Preparación colonoscopia pendiente.', 0)
  RETURNING id INTO v_paciente_rafael;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('María Francisca', 'Pérez', '+34 612 345 003', 'estetica', 'Tratamiento facial en curso.', 1)
  RETURNING id INTO v_paciente_francisca;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Francisco Javier', 'Criado', '+34 612 345 004', 'dietetica', 'Analítica pendiente de revisión.', 0)
  RETURNING id INTO v_paciente_francisco;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Carmen', 'Meca', '+34 612 345 005', 'estetica', 'Tratamiento facial martes.', 0)
  RETURNING id INTO v_paciente_carmen;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Mercedes', 'Alcaina', '+34 612 345 006', 'dietetica', 'Presupuesto revisión dietética pendiente.', 0)
  RETURNING id INTO v_paciente_mercedes;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Irene', 'Pineda', '+34 612 345 007', 'estetica', 'Mesoterapia miércoles 10:30.', 0)
  RETURNING id INTO v_paciente_irene;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Silvia', 'Valdivia', '+34 612 345 008', 'dietetica', 'Primera consulta nutrición.', 0)
  RETURNING id INTO v_paciente_silvia;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Eva María', 'Madero', '+34 612 345 009', 'ambos', 'Seguimiento dieta + tratamiento corporal.', 0)
  RETURNING id INTO v_paciente_eva;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Antonio', 'López García', '+34 612 345 010', 'dietetica', NULL, 0)
  RETURNING id INTO v_paciente_antonio;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Laura', 'Martínez Ros', '+34 612 345 011', 'estetica', NULL, 0)
  RETURNING id INTO v_paciente_laura;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('José', 'Hernández', '+34 612 345 012', 'dietetica', NULL, 1)
  RETURNING id INTO v_paciente_jose;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Ana', 'Beltrán Ruiz', '+34 612 345 013', 'estetica', NULL, 0)
  RETURNING id INTO v_paciente_ana;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Pedro', 'Navarro Gil', '+34 612 345 014', 'dietetica', NULL, 0)
  RETURNING id INTO v_paciente_pedro;

  INSERT INTO public.pacientes (nombre, apellidos, telefono, tipo, notas_internas, cancelaciones_total)
  VALUES ('Yolanda', 'Rubi', '+34 612 345 015', 'estetica', 'Reagendada tras cancelación.', 2)
  RETURNING id INTO v_paciente_yolanda;

  -- --------------------------------------------------------
  -- SEED: Citas de mañana (simulación)
  -- --------------------------------------------------------
  INSERT INTO public.citas (paciente_id, fecha, hora, tipo, estado, motivo) VALUES
    (v_paciente_elena,     CURRENT_DATE + 1, '09:00', 'dietetica', 'pendiente',   'Revisión peso mensual'),
    (v_paciente_rafael,    CURRENT_DATE + 1, '09:30', 'dietetica', 'confirmada',  'Preparación colonoscopia'),
    (v_paciente_francisca, CURRENT_DATE + 1, '10:00', 'estetica',  'cancelada',   'Tratamiento facial'),
    (v_paciente_carmen,    CURRENT_DATE + 1, '10:30', 'estetica',  'pendiente',   'Tratamiento facial'),
    (v_paciente_antonio,   CURRENT_DATE + 1, '11:00', 'dietetica', 'confirmada',  'Control dieta'),
    (v_paciente_laura,     CURRENT_DATE + 1, '11:30', 'estetica',  'confirmada',  'Mesoterapia'),
    (v_paciente_jose,      CURRENT_DATE + 1, '12:00', 'dietetica', 'confirmada',  'Seguimiento'),
    (v_paciente_ana,       CURRENT_DATE + 1, '12:30', 'estetica',  'confirmada',  'Radiofrecuencia');

  -- --------------------------------------------------------
  -- SEED: Informe diario
  -- --------------------------------------------------------
  INSERT INTO public.informes_diarios (fecha, total_conversaciones, total_pacientes, total_confirmados, total_cancelaciones, total_pendientes, total_urgentes, resumen_ejecutivo, puntos_clave)
  VALUES (
    CURRENT_DATE,
    18, 15, 6, 2, 3, 4,
    'Jornada con actividad moderada. 18 conversaciones procesadas de 15 pacientes. 4 situaciones requieren atención urgente, principalmente seguimiento de pacientes con cancelaciones recurrentes y resultados pendientes.',
    ARRAY[
      'Elena Aguado acumula 3ª cancelación consecutiva — requiere llamada directa',
      'Rafael Sánchez no ha recibido preparación colonoscopia — reenviar documentación',
      'Analítica de Francisco Javier Criado pendiente de revisión con Dr.',
      '6 pacientes confirmados para mañana',
      '2 cancelaciones registradas hoy',
      '8 tareas pendientes para Noelia'
    ]
  )
  RETURNING id INTO v_informe_id;

  -- --------------------------------------------------------
  -- SEED: Informe pacientes (detalle por categoría)
  -- --------------------------------------------------------
  -- Urgentes
  INSERT INTO public.informe_pacientes (informe_id, paciente_id, categoria, descripcion, accion_requerida, etiquetas, hora_cita) VALUES
    (v_informe_id, v_paciente_elena,     'urgente',    'Canceló 3ª cita consecutiva. Dice "ya iré cuando pueda". Patrón de abandono.', 'Llamar para confirmar si viene el jueves o reagendar', ARRAY['cancelación recurrente', '3ª vez'], '09:00'),
    (v_informe_id, v_paciente_rafael,    'urgente',    'Pregunta por preparación colonoscopia. No tiene el documento.', 'Reenviar preparación por WhatsApp', ARRAY['documento pendiente'], '09:30'),
    (v_informe_id, v_paciente_francisca, 'urgente',    'Canceló cita de hoy. Pide nueva fecha "la semana que viene".', 'Reagendar cita semana próxima', ARRAY['cancelación', 'reagendar'], '10:00'),
    (v_informe_id, v_paciente_francisco, 'urgente',    'Envió foto de analítica por WhatsApp. Necesita revisión del Dr.', 'Gestionar con Dr. Sergio', ARRAY['analítica', 'revisión médica'], NULL);

  -- Pendientes
  INSERT INTO public.informe_pacientes (informe_id, paciente_id, categoria, descripcion, accion_requerida, hora_cita) VALUES
    (v_informe_id, v_paciente_carmen,    'pendiente',  'No ha confirmado cita del martes. Tratamiento facial.', 'Confirmar asistencia', '10:30'),
    (v_informe_id, v_paciente_mercedes,  'pendiente',  'Pide presupuesto para revisión dietética completa.', 'Enviar presupuesto', NULL),
    (v_informe_id, v_paciente_irene,     'pendiente',  'Pregunta si puede cambiar hora de mesoterapia del miércoles.', 'Confirmar disponibilidad', '10:30'),
    (v_informe_id, v_paciente_silvia,    'pendiente',  'Primera consulta nutrición. Pide información previa.', 'Enviar documentación primera visita', NULL),
    (v_informe_id, v_paciente_eva,       'pendiente',  'Pregunta por resultados de bioimpedancia de la semana pasada.', 'Buscar resultados y enviar', NULL);

  -- Confirmados
  INSERT INTO public.informe_pacientes (informe_id, paciente_id, categoria, hora_cita) VALUES
    (v_informe_id, v_paciente_antonio, 'confirmado', '11:00'),
    (v_informe_id, v_paciente_laura,   'confirmado', '11:30'),
    (v_informe_id, v_paciente_jose,    'confirmado', '12:00'),
    (v_informe_id, v_paciente_ana,     'confirmado', '12:30'),
    (v_informe_id, v_paciente_rafael,  'confirmado', '09:30'),
    (v_informe_id, v_paciente_pedro,   'confirmado', '13:00');

  -- No acuden
  INSERT INTO public.informe_pacientes (informe_id, paciente_id, categoria, motivo_cancelacion, reagendado) VALUES
    (v_informe_id, v_paciente_yolanda, 'no_acude', 'Motivos personales', true),
    (v_informe_id, v_paciente_elena,   'no_acude', 'Sin motivo claro — 3ª vez', false);

  -- --------------------------------------------------------
  -- SEED: Tareas Noelia
  -- --------------------------------------------------------
  INSERT INTO public.tareas_noelia (informe_id, paciente_id, titulo, descripcion, prioridad, estado, orden) VALUES
    (v_informe_id, v_paciente_elena,     'Llamar a Elena Aguado',           'Confirmar si viene el jueves o reagendar', 'urgente',  'pendiente', 1),
    (v_informe_id, v_paciente_rafael,    'Contactar a Rafael Sánchez',      'Reenviar preparación colonoscopia',        'urgente',  'pendiente', 2),
    (v_informe_id, v_paciente_francisca, 'Llamar a Mª Francisca Pérez',    'Reagendar cita cancelada',                 'urgente',  'pendiente', 3),
    (v_informe_id, v_paciente_francisco, 'Gestionar analítica F.J. Criado', 'Revisar resultado con Dr. Sergio',         'urgente',  'pendiente', 4),
    (v_informe_id, v_paciente_carmen,    'Confirmar cita Carmen Meca',      'Tratamiento facial martes',                'alta',     'pendiente', 5),
    (v_informe_id, v_paciente_mercedes,  'Enviar presupuesto Mercedes',     'Revisión dietética',                       'alta',     'pendiente', 6),
    (v_informe_id, v_paciente_irene,     'Recordar cita Irene Pineda',      'Mesoterapia miércoles 10:30',              'alta',     'pendiente', 7),
    (v_informe_id, v_paciente_silvia,    'Preparar documentación Silvia',   'Primera consulta nutrición',               'alta',     'pendiente', 8);

  -- --------------------------------------------------------
  -- SEED: Configuración
  -- --------------------------------------------------------
  INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
    ('clinica_nombre', '"Clínica Dietética y Estética Dr. Sergio"', 'Nombre de la clínica'),
    ('horario', '{"lunes_viernes": "09:00-14:00 / 16:00-20:00", "sabado": "09:00-14:00"}', 'Horario de atención'),
    ('whatsapp_numero', '"+34 600 000 000"', 'Número de WhatsApp de la clínica'),
    ('n8n_informe_hora', '"07:30"', 'Hora de generación automática del informe diario'),
    ('asistente_nombre', '"Noelia"', 'Nombre de la asistente principal'),
    ('evolution_instance', '"clinica-dr-sergio"', 'Nombre de la instancia en Evolution API');

  -- --------------------------------------------------------
  -- SEED: Interacciones recientes
  -- --------------------------------------------------------
  INSERT INTO public.interacciones (paciente_id, origen, mensaje_original, resumen_ia, categoria, accion_requerida, procesado) VALUES
    (v_paciente_elena,     'whatsapp', 'Hola, mira es que no voy a poder ir mañana. Ya iré cuando pueda.', 'Paciente cancela cita por 3ª vez consecutiva sin motivo claro.', 'urgente', 'Llamar para confirmar reagendamiento', true),
    (v_paciente_rafael,    'whatsapp', 'Buenos días, tengo la colonoscopia el viernes y no sé qué tengo que hacer de preparación', 'Paciente solicita documentación de preparación colonoscopia.', 'urgente', 'Reenviar documento de preparación', true),
    (v_paciente_carmen,    'whatsapp', 'Hola buenas, tenía cita el martes pero no me acuerdo a qué hora', 'Paciente consulta hora de su cita del martes.', 'pendiente', 'Confirmar hora de cita', true),
    (v_paciente_antonio,   'whatsapp', 'Perfecto, allí estaré a las 11. Gracias!', 'Paciente confirma asistencia a cita de las 11:00.', 'confirmado', NULL, true),
    (v_paciente_laura,     'whatsapp', 'Confirmado para mañana. ¿Puedo llevar pantalón corto para la mesoterapia?', 'Paciente confirma cita y pregunta por vestimenta.', 'confirmado', 'Responder sobre vestimenta', true);

END $$;
