-- ============================================
-- WhatsApp Clinic Dashboard — Supabase Schema
-- ============================================

-- 1. Pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  last_interaction TIMESTAMPTZ,
  total_conversations INTEGER DEFAULT 0,
  next_appointment TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for search
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients USING gin(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- 2. Mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'sticker')),
  wa_message_id TEXT UNIQUE,
  wa_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 3. Conversaciones (agrupación de mensajes por día/tema)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  type TEXT DEFAULT 'general_inquiry' CHECK (type IN (
    'appointment_booking', 'appointment_change', 'appointment_cancel',
    'general_inquiry', 'urgent', 'follow_up', 'pricing', 'other'
  )),
  messages_count INTEGER DEFAULT 0,
  ai_classification JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_patient ON conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(date DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- 4. Citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'urgent')),
  notes TEXT,
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'manual', 'phone')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- 5. Tareas pendientes
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  phone TEXT,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 6. Informes diarios
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
  summary JSONB,
  conversations_by_type JSONB,
  top_issues JSONB,
  total_conversations INTEGER DEFAULT 0,
  unique_patients INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  appointments_cancelled INTEGER DEFAULT 0,
  urgent_cases INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  raw_data JSONB,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_date ON daily_reports(date DESC);

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_patients_updated BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_conversations_updated BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_appointments_updated BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. RLS (Row Level Security) — habilitado pero abierto por service_role
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Policies: anon key puede leer todo (dashboard usa anon key + JWT propio)
CREATE POLICY "Allow anon read" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON patients FOR UPDATE USING (true);

CREATE POLICY "Allow anon read" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON conversations FOR UPDATE USING (true);

CREATE POLICY "Allow anon read" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON appointments FOR UPDATE USING (true);

CREATE POLICY "Allow anon read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON tasks FOR UPDATE USING (true);

CREATE POLICY "Allow anon read" ON daily_reports FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON daily_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON daily_reports FOR UPDATE USING (true);
