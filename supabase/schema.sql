-- ══════════════════════════════════════════════════════════════════════════════
-- WhatsApp Clinic Dashboard - PostgreSQL Schema
-- Base de datos para gestionar pacientes, mensajes, resumenes y reportes
-- generados a partir de conversaciones de WhatsApp de una clinica
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- EXTENSION: uuid-ossp (por si se necesita en el futuro)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLA: patients
-- Registro maestro de pacientes de la clinica
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE patients (
    id                  SERIAL PRIMARY KEY,
    phone               VARCHAR(15) UNIQUE NOT NULL,
    whatsapp_jid        VARCHAR(30),
    name                VARCHAR(200),
    type                VARCHAR(50) DEFAULT 'desconocido'
                            CHECK (type IN ('dieta', 'estetica', 'ambos', 'desconocido')),
    doctor              VARCHAR(100),
    first_seen          DATE,
    total_appointments  INT DEFAULT 0,
    total_cancellations INT DEFAULT 0,
    reliability_score   DECIMAL(3,2) DEFAULT 1.00
                            CHECK (reliability_score >= 0 AND reliability_score <= 1),
    next_appointment    TIMESTAMPTZ,
    notes               TEXT,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE patients IS 'Registro maestro de pacientes identificados por su numero de telefono de WhatsApp';
COMMENT ON COLUMN patients.type IS 'Tipo de tratamiento: dieta, estetica, ambos o desconocido';
COMMENT ON COLUMN patients.reliability_score IS 'Puntuacion de fiabilidad 0.00-1.00 basada en citas cumplidas vs canceladas';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLA: raw_messages
-- Mensajes crudos importados desde WhatsApp
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE raw_messages (
    id              SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    message_id      VARCHAR(100),
    from_me         BOOLEAN NOT NULL,
    content         TEXT,
    media_type      VARCHAR(50),
    timestamp       TIMESTAMPTZ NOT NULL,
    raw_json        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raw_messages_patient_timestamp ON raw_messages(patient_id, timestamp);
CREATE INDEX idx_raw_messages_patient_id ON raw_messages(patient_id);
CREATE INDEX idx_raw_messages_timestamp ON raw_messages(timestamp);

COMMENT ON TABLE raw_messages IS 'Mensajes crudos importados de WhatsApp, tanto enviados como recibidos';
COMMENT ON COLUMN raw_messages.from_me IS 'true si el mensaje fue enviado por la clinica, false si lo envio el paciente';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLA: conversation_summaries
-- Resumenes diarios generados por IA de cada conversacion con paciente
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE conversation_summaries (
    id                      SERIAL PRIMARY KEY,
    patient_id              INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date                    DATE NOT NULL,
    summary                 TEXT NOT NULL,
    status                  VARCHAR(20) NOT NULL
                                CHECK (status IN ('urgent', 'pending', 'resolved', 'no_show')),
    status_reason           TEXT,
    cancel_reason           TEXT,
    has_appointment         BOOLEAN,
    appointment_time        VARCHAR(10),
    appointment_confirmed   VARCHAR(20),
    next_appointment_date   DATE,
    next_appointment_notes  TEXT,
    pending_action          TEXT,
    waiting_response_from   VARCHAR(20),
    raw_messages            JSONB,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(patient_id, date)
);

CREATE INDEX idx_conversation_summaries_patient_id ON conversation_summaries(patient_id);
CREATE INDEX idx_conversation_summaries_date ON conversation_summaries(date);
CREATE INDEX idx_conversation_summaries_status ON conversation_summaries(status);

COMMENT ON TABLE conversation_summaries IS 'Resumen diario generado por IA de la conversacion con cada paciente';
COMMENT ON COLUMN conversation_summaries.status IS 'Estado: urgent (requiere atencion), pending (esperando respuesta), resolved (gestionado), no_show (no se presento)';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLA: daily_reports
-- Reportes diarios consolidados generados por IA
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE daily_reports (
    id                      SERIAL PRIMARY KEY,
    date                    DATE UNIQUE NOT NULL,
    report_md               TEXT NOT NULL,
    stats                   JSONB NOT NULL,
    appointments            JSONB,
    pending_tasks           JSONB,
    cancelled_without_next  JSONB,
    unconfirmed_changes     JSONB,
    generated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_reports_date ON daily_reports(date);

COMMENT ON TABLE daily_reports IS 'Reportes diarios consolidados con estadisticas, citas y tareas pendientes';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLA: chat_history
-- Historial de preguntas/respuestas del asistente IA del dashboard
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE chat_history (
    id              SERIAL PRIMARY KEY,
    context_type    VARCHAR(20) NOT NULL,
    context_id      VARCHAR(50),
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_history_context ON chat_history(context_type, context_id);

COMMENT ON TABLE chat_history IS 'Historial de interacciones con el asistente IA del dashboard';
COMMENT ON COLUMN chat_history.context_type IS 'Tipo de contexto: global, patient, report, etc.';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLA: patient_notes
-- Notas manuales o automaticas asociadas a cada paciente
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE patient_notes (
    id              SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    note            TEXT NOT NULL,
    author          VARCHAR(100) DEFAULT 'sistema',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_notes_patient_id ON patient_notes(patient_id);

COMMENT ON TABLE patient_notes IS 'Notas manuales del equipo o generadas automaticamente por el sistema';

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCION: Actualizar updated_at automaticamente
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversation_summaries_updated_at
    BEFORE UPDATE ON conversation_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA: Pacientes
-- 20 pacientes con datos realistas de clinica espanola
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO patients (phone, whatsapp_jid, name, type, doctor, first_seen, total_appointments, total_cancellations, reliability_score, next_appointment, notes, is_active)
VALUES
    -- 1. Elena Aguado
    ('34612345001', '34612345001@s.whatsapp.net', 'Elena Aguado', 'dieta', 'Dra. Lopez', '2025-06-15', 12, 1, 0.92,
     '2026-02-05 10:00:00+01', 'Seguimiento dieta mediterranea. Buena adherencia.', true),

    -- 2. Maria Jose Casas
    ('34612345002', '34612345002@s.whatsapp.net', 'Maria Jose Casas', 'estetica', 'Dr. Martinez', '2025-03-20', 8, 0, 1.00,
     '2026-02-04 11:30:00+01', 'Tratamiento facial antiedad. Muy puntual.', true),

    -- 3. Patricia Barco
    ('34612345003', '34612345003@s.whatsapp.net', 'Patricia Barco', 'ambos', 'Dra. Lopez', '2025-01-10', 15, 3, 0.80,
     '2026-02-06 09:00:00+01', 'Dieta + tratamiento corporal. Cancela por trabajo a veces.', true),

    -- 4. Samuel Bedmar
    ('34612345004', '34612345004@s.whatsapp.net', 'Samuel Bedmar', 'dieta', 'Dr. Navarro', '2025-09-01', 6, 0, 1.00,
     '2026-02-07 16:00:00+01', 'Dieta deportiva. Muy comprometido.', true),

    -- 5. Pilar Gomez
    ('34612345005', '34612345005@s.whatsapp.net', 'Pilar Gomez', 'estetica', 'Dr. Martinez', '2024-11-05', 20, 2, 0.90,
     '2026-02-04 09:30:00+01', 'Paciente habitual estetica. Tratamiento laser.', true),

    -- 6. Sara Martinez
    ('34612345006', '34612345006@s.whatsapp.net', 'Sara Martinez', 'dieta', 'Dra. Lopez', '2025-07-22', 10, 4, 0.60,
     NULL, 'Ha cancelado varias citas seguidas. Seguimiento necesario.', true),

    -- 7. Yolanda Rubi
    ('34612345007', '34612345007@s.whatsapp.net', 'Yolanda Rubi', 'ambos', 'Dr. Navarro', '2025-04-12', 9, 1, 0.89,
     '2026-02-05 12:00:00+01', 'Dieta cetogenica + mesoterapia.', true),

    -- 8. Rafael Sanchez
    ('34612345008', '34612345008@s.whatsapp.net', 'Rafael Sanchez', 'dieta', 'Dra. Lopez', '2025-08-30', 5, 2, 0.60,
     '2026-02-10 10:30:00+01', 'Dieta para hipertension. Olvida citas con frecuencia.', true),

    -- 9. Carmen Meca
    ('34612345009', '34612345009@s.whatsapp.net', 'Carmen Meca', 'estetica', 'Dr. Martinez', '2025-02-14', 14, 0, 1.00,
     '2026-02-03 17:00:00+01', 'Tratamiento rejuvenecimiento. Paciente ejemplar.', true),

    -- 10. Mercedes Alcaina
    ('34612345010', '34612345010@s.whatsapp.net', 'Mercedes Alcaina', 'dieta', 'Dr. Navarro', '2025-05-08', 11, 1, 0.91,
     '2026-02-04 16:30:00+01', 'Dieta para diabetes tipo 2. Buen progreso.', true),

    -- 11. Irene Pineda
    ('34612345011', '34612345011@s.whatsapp.net', 'Irene Pineda', 'estetica', 'Dr. Martinez', '2025-10-01', 4, 1, 0.75,
     '2026-02-08 11:00:00+01', 'Botox y rellenos. Primera vez cancelo por enfermedad.', true),

    -- 12. Silvia Valdivia
    ('34612345012', '34612345012@s.whatsapp.net', 'Silvia Valdivia', 'ambos', 'Dra. Lopez', '2025-06-01', 13, 2, 0.85,
     '2026-02-05 15:00:00+01', 'Plan integral dieta + estetica corporal.', true),

    -- 13. Eva Maria Madero
    ('34612345013', '34612345013@s.whatsapp.net', 'Eva Maria Madero', 'dieta', 'Dr. Navarro', '2025-03-15', 7, 3, 0.57,
     NULL, 'No contesta mensajes desde hace 2 semanas. Posible abandono.', true),

    -- 14. Francisco Javier Criado
    ('34612345014', '34612345014@s.whatsapp.net', 'Francisco Javier Criado', 'dieta', 'Dra. Lopez', '2025-11-20', 3, 0, 1.00,
     '2026-02-06 10:00:00+01', 'Paciente nuevo. Dieta para colesterol alto.', true),

    -- 15. Maria Francisca Perez
    ('34612345015', '34612345015@s.whatsapp.net', 'Maria Francisca Perez', 'estetica', 'Dr. Martinez', '2024-09-10', 22, 1, 0.95,
     '2026-02-03 12:00:00+01', 'Paciente fidelizada. Tratamientos regulares.', true),

    -- 16. Nadina Rodriguez
    ('34612345016', '34612345016@s.whatsapp.net', 'Nadina Rodriguez', 'dieta', 'Dr. Navarro', '2025-08-05', 6, 2, 0.67,
     '2026-02-11 09:00:00+01', 'Dieta vegana. Cancela cuando viaja por trabajo.', true),

    -- 17. Elida Lusffi
    ('34612345017', '34612345017@s.whatsapp.net', 'Elida Lusffi', 'ambos', 'Dra. Lopez', '2025-01-25', 16, 0, 1.00,
     '2026-02-04 10:00:00+01', 'Paciente ideal. Nunca falta. Dieta + facial.', true),

    -- 18. Antonio Ruiz Delgado
    ('34612345018', '34612345018@s.whatsapp.net', 'Antonio Ruiz Delgado', 'dieta', 'Dr. Navarro', '2025-12-01', 2, 1, 0.50,
     '2026-02-12 17:00:00+01', 'Paciente reciente. Cancelo la segunda cita.', true),

    -- 19. Lucia Fernandez Ortega
    ('34612345019', '34612345019@s.whatsapp.net', 'Lucia Fernandez Ortega', 'estetica', 'Dr. Martinez', '2025-07-10', 9, 0, 1.00,
     '2026-02-05 14:00:00+01', 'Peeling quimico y microdermoabrasion.', true),

    -- 20. Jose Manuel Herrera
    ('34612345020', '34612345020@s.whatsapp.net', 'Jose Manuel Herrera', 'dieta', 'Dra. Lopez', '2025-10-15', 4, 1, 0.75,
     '2026-02-07 11:30:00+01', 'Dieta para deportista amateur. Cancelo una vez por lesion.', true);

-- ══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA: Conversation Summaries (2026-02-03)
-- Resumenes del dia para cada paciente
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO conversation_summaries (patient_id, date, summary, status, status_reason, cancel_reason, has_appointment, appointment_time, appointment_confirmed, next_appointment_date, next_appointment_notes, pending_action, waiting_response_from)
VALUES
    -- 1. Elena Aguado - resolved
    (1, '2026-02-03',
     'Elena confirma su cita del jueves 5 de febrero a las 10:00. Comenta que ha seguido la dieta al pie de la letra esta semana y se siente con mas energia. Pregunta si puede incluir frutos secos en la merienda.',
     'resolved', 'Cita confirmada y consulta respondida', NULL,
     true, '10:00', 'confirmada', '2026-02-05', 'Revision semanal dieta mediterranea',
     NULL, NULL),

    -- 2. Maria Jose Casas - resolved
    (2, '2026-02-03',
     'Maria Jose pregunta por los cuidados post-tratamiento facial que se hizo la semana pasada. Se le indican las cremas y la proteccion solar. Confirma cita del martes 4 a las 11:30.',
     'resolved', 'Dudas resueltas y cita confirmada', NULL,
     true, '11:30', 'confirmada', '2026-02-04', 'Revision post-tratamiento facial',
     NULL, NULL),

    -- 3. Patricia Barco - pending
    (3, '2026-02-03',
     'Patricia solicita cambiar la cita del viernes 6 al lunes 9. Dice que le ha surgido una reunion de trabajo. Pendiente de confirmar disponibilidad del lunes.',
     'pending', 'Solicitud de cambio de cita pendiente de confirmar', NULL,
     true, '09:00', 'pendiente cambio', '2026-02-06', 'Quiere mover al lunes 9',
     'Confirmar disponibilidad lunes 9 de febrero', 'clinica'),

    -- 4. Samuel Bedmar - resolved
    (4, '2026-02-03',
     'Samuel envia fotos de sus comidas del fin de semana para que el nutricionista las revise. Todo correcto segun la pauta. Se le felicita por su constancia.',
     'resolved', 'Seguimiento rutinario completado', NULL,
     true, '16:00', 'confirmada', '2026-02-07', 'Control quincenal dieta deportiva',
     NULL, NULL),

    -- 5. Pilar Gomez - resolved
    (5, '2026-02-03',
     'Pilar confirma su cita de manana 4 de febrero a las 9:30 para sesion laser. Pregunta si debe venir sin maquillaje. Se le confirma que si.',
     'resolved', 'Cita confirmada con instrucciones previas', NULL,
     true, '09:30', 'confirmada', '2026-02-04', 'Sesion laser facial',
     NULL, NULL),

    -- 6. Sara Martinez - urgent
    (6, '2026-02-03',
     'Sara lleva sin responder a los ultimos 3 mensajes enviados durante la semana pasada. No tiene cita programada. Ultima visita fue hace 3 semanas. Posible abandono del tratamiento.',
     'urgent', 'Sin respuesta desde hace mas de una semana', NULL,
     false, NULL, NULL, NULL, NULL,
     'Llamar por telefono para seguimiento', 'paciente'),

    -- 7. Yolanda Rubi - resolved
    (7, '2026-02-03',
     'Yolanda pregunta por los resultados de su analisis de sangre que se hizo la semana pasada. Se le informa que los resultados llegan en 3-5 dias habiles. Confirma cita del jueves 5 a las 12:00.',
     'resolved', 'Consulta resuelta y cita confirmada', NULL,
     true, '12:00', 'confirmada', '2026-02-05', 'Revision mesoterapia + resultados analitica',
     NULL, NULL),

    -- 8. Rafael Sanchez - pending
    (8, '2026-02-03',
     'Rafael responde al recordatorio de cita del 10 de febrero diciendo que lo tiene apuntado. Pregunta si puede llevar la lista de lo que ha comido esta semana. Se le confirma que si.',
     'pending', 'Cita anotada pero no confirmada explicitamente', NULL,
     true, '10:30', 'sin confirmar', '2026-02-10', 'Revision dieta hipertension',
     'Pedir confirmacion explicita de la cita', 'paciente'),

    -- 9. Carmen Meca - resolved
    (9, '2026-02-03',
     'Carmen confirma su cita de hoy a las 17:00 para sesion de rejuvenecimiento. Llega puntual. Tratamiento realizado sin incidencias. Proxima cita programada para el 17 de febrero.',
     'resolved', 'Cita completada exitosamente', NULL,
     true, '17:00', 'completada', '2026-02-17', 'Siguiente sesion rejuvenecimiento',
     NULL, NULL),

    -- 10. Mercedes Alcaina - resolved
    (10, '2026-02-03',
     'Mercedes comparte que su nivel de glucosa ha bajado esta semana y esta muy contenta. Se le felicita y se le recuerda la cita de manana 4 a las 16:30. Confirma asistencia.',
     'resolved', 'Buenas noticias compartidas y cita confirmada', NULL,
     true, '16:30', 'confirmada', '2026-02-04', 'Control mensual diabetes tipo 2',
     NULL, NULL),

    -- 11. Irene Pineda - pending
    (11, '2026-02-03',
     'Irene envia mensaje preguntando precios de un nuevo tratamiento de acido hialuronico que vio en redes sociales. Pendiente de enviarle presupuesto detallado.',
     'pending', 'Esperando presupuesto del tratamiento consultado', NULL,
     true, '11:00', 'confirmada', '2026-02-08', 'Sesion botox programada',
     'Enviar presupuesto acido hialuronico', 'clinica'),

    -- 12. Silvia Valdivia - resolved
    (12, '2026-02-03',
     'Silvia confirma cita del jueves 5 a las 15:00. Comenta que ha perdido 1.5kg esta semana siguiendo el plan. Muy motivada con los resultados del tratamiento corporal.',
     'resolved', 'Cita confirmada y progreso positivo', NULL,
     true, '15:00', 'confirmada', '2026-02-05', 'Revision integral dieta + estetica corporal',
     NULL, NULL),

    -- 13. Eva Maria Madero - urgent
    (13, '2026-02-03',
     'Eva Maria sigue sin contestar. Se le ha enviado mensaje de seguimiento recordandole que puede retomar el tratamiento cuando quiera. Sin respuesta. Es la tercera semana sin contacto.',
     'urgent', 'Paciente no responde desde hace 3 semanas', NULL,
     false, NULL, NULL, NULL, NULL,
     'Ultimo intento de contacto por telefono antes de marcar como inactiva', 'paciente'),

    -- 14. Francisco Javier Criado - resolved
    (14, '2026-02-03',
     'Francisco Javier confirma cita del viernes 6 a las 10:00. Envia foto del informe de colesterol del medico de cabecera. Niveles altos pero dentro de lo esperado para inicio de tratamiento.',
     'resolved', 'Cita confirmada y documentacion recibida', NULL,
     true, '10:00', 'confirmada', '2026-02-06', 'Tercera consulta dieta colesterol',
     NULL, NULL),

    -- 15. Maria Francisca Perez - resolved
    (15, '2026-02-03',
     'Maria Francisca acude a su cita de las 12:00. Tratamiento estetico realizado sin incidencias. Muy satisfecha con el resultado. Programa siguiente cita para el 17 de febrero.',
     'resolved', 'Cita completada exitosamente', NULL,
     true, '12:00', 'completada', '2026-02-17', 'Sesion mantenimiento mensual',
     NULL, NULL),

    -- 16. Nadina Rodriguez - no_show
    (16, '2026-02-03',
     'Nadina tenia cita hoy a las 9:00 pero no se ha presentado ni ha avisado. Se le envia mensaje preguntando si esta bien y si quiere reprogramar. Sin respuesta por el momento.',
     'no_show', 'No se presento a la cita sin previo aviso', 'No aviso ni se presento',
     true, '09:00', 'no show', NULL, NULL,
     'Esperar respuesta y ofrecer nueva cita', 'paciente'),

    -- 17. Elida Lusffi - resolved
    (17, '2026-02-03',
     'Elida confirma su cita de manana 4 de febrero a las 10:00. Pregunta si puede traer a su hija para que le hagan una valoracion. Se le confirma que si, que pida cita aparte.',
     'resolved', 'Cita confirmada y consulta resuelta', NULL,
     true, '10:00', 'confirmada', '2026-02-04', 'Sesion dieta + tratamiento facial',
     NULL, NULL),

    -- 18. Antonio Ruiz Delgado - pending
    (18, '2026-02-03',
     'Antonio pregunta si puede adelantar la cita del 12 de febrero a esta semana porque se va de viaje. Pendiente de revisar agenda.',
     'pending', 'Solicitud de adelanto de cita', NULL,
     true, '17:00', 'pendiente cambio', '2026-02-12', 'Quiere adelantar la cita',
     'Revisar disponibilidad esta semana para Antonio', 'clinica'),

    -- 19. Lucia Fernandez Ortega - resolved
    (19, '2026-02-03',
     'Lucia confirma cita del jueves 5 a las 14:00. Envia fotos del progreso del peeling de la sesion anterior. La piel se ve bien, buena evolucion.',
     'resolved', 'Cita confirmada y seguimiento positivo', NULL,
     true, '14:00', 'confirmada', '2026-02-05', 'Segunda sesion peeling quimico',
     NULL, NULL),

    -- 20. Jose Manuel Herrera - pending
    (20, '2026-02-03',
     'Jose Manuel escribe diciendo que no esta seguro de poder asistir el sabado 7 a las 11:30 porque tiene un partido de futbol. Dice que confirmara manana.',
     'pending', 'Pendiente de confirmacion de cita', NULL,
     true, '11:30', 'sin confirmar', '2026-02-07', 'Revision dieta deportista',
     'Esperar confirmacion de Jose Manuel para el sabado', 'paciente');

-- ══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA: Daily Report (2026-02-03)
-- Reporte diario consolidado con estadisticas
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO daily_reports (date, report_md, stats, appointments, pending_tasks, cancelled_without_next, unconfirmed_changes, generated_at)
VALUES (
    '2026-02-03',

    -- report_md
    E'# Reporte Diario - 3 de Febrero de 2026\n\n'
    '## Resumen General\n\n'
    'Dia con actividad moderada-alta. Se procesaron conversaciones de **20 pacientes**. '
    'Dos pacientes requieren atencion urgente por falta de respuesta prolongada (Sara Martinez y Eva Maria Madero). '
    'Una paciente no se presento a su cita (Nadina Rodriguez).\n\n'
    '## Estadisticas del Dia\n\n'
    '| Metrica | Valor |\n'
    '|---------|-------|\n'
    '| Pacientes activos | 20 |\n'
    '| Conversaciones procesadas | 20 |\n'
    '| Citas completadas hoy | 2 |\n'
    '| Citas confirmadas proximos dias | 12 |\n'
    '| Pendientes de confirmar | 4 |\n'
    '| No shows | 1 |\n'
    '| Casos urgentes | 2 |\n'
    '| Fiabilidad media | 0.82 |\n\n'
    '## Citas Completadas Hoy\n\n'
    '- **12:00** - Maria Francisca Perez (estetica) - Sesion mantenimiento - OK\n'
    '- **17:00** - Carmen Meca (estetica) - Rejuvenecimiento - OK\n\n'
    '## Alertas\n\n'
    '- :warning: **Sara Martinez** - Sin respuesta hace mas de 1 semana. Llamar por telefono.\n'
    '- :warning: **Eva Maria Madero** - 3 semanas sin contacto. Ultimo intento antes de marcar inactiva.\n'
    '- :x: **Nadina Rodriguez** - No show a las 9:00. Pendiente de respuesta.\n\n'
    '## Tareas Pendientes para Manana\n\n'
    '1. Confirmar disponibilidad lunes 9 para Patricia Barco\n'
    '2. Enviar presupuesto acido hialuronico a Irene Pineda\n'
    '3. Revisar agenda para adelantar cita de Antonio Ruiz Delgado\n'
    '4. Llamar a Sara Martinez y Eva Maria Madero\n'
    '5. Contactar a Nadina Rodriguez por el no show\n'
    '6. Esperar confirmaciones de Rafael Sanchez y Jose Manuel Herrera\n',

    -- stats
    '{
        "total_patients": 20,
        "conversations_processed": 20,
        "appointments_today": 2,
        "appointments_completed": 2,
        "appointments_confirmed_upcoming": 12,
        "appointments_pending_confirmation": 4,
        "no_shows": 1,
        "urgent_cases": 2,
        "resolved": 12,
        "pending": 4,
        "avg_reliability": 0.82,
        "by_type": {
            "dieta": 10,
            "estetica": 6,
            "ambos": 4
        },
        "by_doctor": {
            "Dra. Lopez": 8,
            "Dr. Martinez": 6,
            "Dr. Navarro": 6
        },
        "by_status": {
            "resolved": 12,
            "pending": 4,
            "urgent": 2,
            "no_show": 1
        }
    }'::jsonb,

    -- appointments
    '[
        {"time": "09:00", "patient": "Nadina Rodriguez", "type": "dieta", "doctor": "Dr. Navarro", "status": "no_show"},
        {"time": "12:00", "patient": "Maria Francisca Perez", "type": "estetica", "doctor": "Dr. Martinez", "status": "completada"},
        {"time": "17:00", "patient": "Carmen Meca", "type": "estetica", "doctor": "Dr. Martinez", "status": "completada"}
    ]'::jsonb,

    -- pending_tasks
    '[
        {"priority": "alta", "task": "Llamar a Sara Martinez - sin respuesta 1+ semana", "patient_id": 6},
        {"priority": "alta", "task": "Ultimo intento contacto Eva Maria Madero antes de marcar inactiva", "patient_id": 13},
        {"priority": "alta", "task": "Contactar Nadina Rodriguez por no show", "patient_id": 16},
        {"priority": "media", "task": "Confirmar disponibilidad lunes 9 para Patricia Barco", "patient_id": 3},
        {"priority": "media", "task": "Enviar presupuesto acido hialuronico a Irene Pineda", "patient_id": 11},
        {"priority": "media", "task": "Revisar agenda para adelantar cita Antonio Ruiz Delgado", "patient_id": 18},
        {"priority": "baja", "task": "Esperar confirmacion Rafael Sanchez cita 10 feb", "patient_id": 8},
        {"priority": "baja", "task": "Esperar confirmacion Jose Manuel Herrera cita 7 feb", "patient_id": 20}
    ]'::jsonb,

    -- cancelled_without_next
    '[
        {"patient": "Sara Martinez", "patient_id": 6, "last_appointment": "2026-01-13", "days_without_contact": 21, "reliability_score": 0.60},
        {"patient": "Eva Maria Madero", "patient_id": 13, "last_appointment": "2026-01-10", "days_without_contact": 24, "reliability_score": 0.57}
    ]'::jsonb,

    -- unconfirmed_changes
    '[
        {"patient": "Patricia Barco", "patient_id": 3, "original": "2026-02-06 09:00", "requested": "2026-02-09", "reason": "Reunion de trabajo"},
        {"patient": "Antonio Ruiz Delgado", "patient_id": 18, "original": "2026-02-12 17:00", "requested": "esta semana", "reason": "Se va de viaje"},
        {"patient": "Rafael Sanchez", "patient_id": 8, "original": "2026-02-10 10:30", "requested": null, "reason": "No ha confirmado explicitamente"},
        {"patient": "Jose Manuel Herrera", "patient_id": 20, "original": "2026-02-07 11:30", "requested": null, "reason": "Tiene partido de futbol, confirmara manana"}
    ]'::jsonb,

    '2026-02-03 20:00:00+01'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA: Patient Notes
-- Notas iniciales para algunos pacientes
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO patient_notes (patient_id, note, author, created_at)
VALUES
    (6,  'Paciente con patron de cancelaciones. Valorar llamada personal para reenganchar.', 'Dra. Lopez', '2026-01-28 10:00:00+01'),
    (13, 'Dejo de responder tras la tercera cancelacion. Posible problema personal.', 'Dr. Navarro', '2026-01-20 14:30:00+01'),
    (16, 'Primera vez que no se presenta. Normalmente avisa si no puede venir.', 'Dr. Navarro', '2026-02-03 09:30:00+01'),
    (17, 'Paciente muy comprometida. Excelente adherencia a todos los tratamientos.', 'Dra. Lopez', '2026-01-15 11:00:00+01'),
    (2,  'Piel sensible. Usar productos hipoalergenicos en todos los tratamientos.', 'Dr. Martinez', '2025-04-01 09:00:00+01'),
    (9,  'Prefiere comunicarse por WhatsApp. No le gustan las llamadas telefonicas.', 'Dr. Martinez', '2025-03-10 16:00:00+01');

-- ══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA: Chat History
-- Ejemplo de interacciones previas con el asistente IA
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO chat_history (context_type, context_id, question, answer, created_at)
VALUES
    ('global', NULL,
     'Cuantos pacientes tienen cita esta semana?',
     'Esta semana hay 14 pacientes con citas programadas entre el 3 y el 7 de febrero. De estas, 12 estan confirmadas, 2 pendientes de confirmacion (Rafael Sanchez y Jose Manuel Herrera), y hay 2 solicitudes de cambio de fecha (Patricia Barco y Antonio Ruiz Delgado).',
     '2026-02-03 08:30:00+01'),

    ('patient', '6',
     'Que pasa con Sara Martinez?',
     'Sara Martinez lleva mas de una semana sin responder a los mensajes. Su ultima visita fue hace 3 semanas. Tiene un reliability_score de 0.60 con 4 cancelaciones en 10 citas. Recomiendo llamarla por telefono para hacer seguimiento y evaluar si quiere continuar el tratamiento.',
     '2026-02-03 09:15:00+01'),

    ('report', '2026-02-03',
     'Dame un resumen de las tareas urgentes de hoy',
     'Hay 3 tareas urgentes para hoy: 1) Llamar a Sara Martinez que lleva 1 semana sin responder, 2) Hacer ultimo intento de contacto con Eva Maria Madero (3 semanas sin contacto) antes de marcarla como inactiva, 3) Contactar a Nadina Rodriguez que no se presento a su cita de las 9:00 sin avisar.',
     '2026-02-03 09:20:00+01');

-- ══════════════════════════════════════════════════════════════════════════════
-- FIN DEL SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════
