// Union types
export type PatientType = "dieta" | "estetica" | "ambos" | "desconocido";
export type ConversationStatus = "urgent" | "pending" | "resolved" | "no_show";
export type AppointmentConfirmed = "confirmed" | "cancelled" | "unconfirmed" | "rescheduled";
export type WaitingResponseFrom = "patient" | "clinic" | "none";
export type ChatContextType = "report" | "patient" | "general";
export type TaskPriority = "high" | "medium";

// Interfaces
export interface Patient {
  id: number;
  phone: string;
  whatsapp_jid: string | null;
  name: string | null;
  type: PatientType;
  doctor: string | null;
  first_seen: string | null;
  total_appointments: number;
  total_cancellations: number;
  reliability_score: number | null;
  next_appointment: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawMessage {
  id: number;
  patient_id: number;
  message_id: string | null;
  from_me: boolean;
  content: string | null;
  media_type: string | null;
  timestamp: string;
  raw_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ConversationSummary {
  id: number;
  patient_id: number;
  date: string;
  summary: string;
  status: ConversationStatus;
  status_reason: string | null;
  cancel_reason: string | null;
  has_appointment: boolean | null;
  appointment_time: string | null;
  appointment_confirmed: AppointmentConfirmed | null;
  next_appointment_date: string | null;
  next_appointment_notes: string | null;
  pending_action: string | null;
  waiting_response_from: WaitingResponseFrom | null;
  raw_messages: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReportStats {
  total_conversations: number;
  urgent: number;
  pending: number;
  resolved: number;
  no_show: number;
  confirmed_ok: number;
  confirmed_names: string[];
  cancelled_no_next: number;
  cancelled_no_next_names: string[];
  unconfirmed_changes: number;
  pending_tasks_noelia: number;
}

export interface AppointmentEntry {
  time: string | null;
  patient_id: number;
  patient_name: string;
  status: string;
  confirmed: AppointmentConfirmed;
  notes: string | null;
}

export interface PendingTask {
  task: string;
  priority: TaskPriority;
  patient_id: number | null;
  patient_name: string | null;
}

export interface DailyReport {
  id: number;
  date: string;
  report_md: string;
  stats: DailyReportStats;
  appointments: AppointmentEntry[] | null;
  pending_tasks: PendingTask[] | null;
  cancelled_without_next: Record<string, unknown>[] | null;
  unconfirmed_changes: Record<string, unknown>[] | null;
  generated_at: string;
}

export interface ChatMessage {
  id: number;
  context_type: ChatContextType;
  context_id: string | null;
  question: string;
  answer: string;
  created_at: string;
}

export interface PatientNote {
  id: number;
  patient_id: number;
  note: string;
  author: string;
  created_at: string;
}
