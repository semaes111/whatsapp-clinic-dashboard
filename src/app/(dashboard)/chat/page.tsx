"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Bot,
  Search,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  loading?: boolean;
}

const suggestedQuestions = [
  "¿Quién canceló hoy?",
  "¿Cuántos confirmaron?",
  "¿Qué queda pendiente?",
  "¿Qué tareas tiene Noelia?",
];

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", maxWidth: 820, margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 },
  backBtn: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center" },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", flex: 1 },
  contextBar: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 12, flexShrink: 0 },
  contextLabel: { fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" as const },
  dateInput: { flex: 1, backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" },
  chipsRow: { display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 16, flexShrink: 0 },
  chip: { padding: "7px 14px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: 20, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const },
  messagesArea: { flex: 1, overflowY: "auto" as const, paddingRight: 4, display: "flex", flexDirection: "column" as const, gap: 16, paddingBottom: 16 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "var(--accent)", color: "var(--white)", padding: "12px 18px", borderRadius: "18px 18px 4px 18px", maxWidth: "75%", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" as const },
  aiBubbleRow: { display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "85%" },
  aiAvatar: { width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  aiBubble: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" as const },
  inputBar: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, marginTop: 8, flexShrink: 0 },
  input: { flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 14, padding: "4px 0" },
  sendBtn: { backgroundColor: "var(--accent)", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--white)", transition: "background 0.15s" },
};

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "var(--text-secondary)" }}>Cargando chat...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportDate = searchParams.get("report") || new Date().toISOString().split("T")[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [contextDate, setContextDate] = useState(reportDate);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
    const loadingMsg: ChatMessage = { id: Date.now() + 1, role: "assistant", text: "Analizando...", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          context_type: "report",
          context_id: contextDate,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "Sin respuesta.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id ? { ...m, text: answer, loading: false } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id ? { ...m, text: "Error de conexión. Inténtalo de nuevo.", loading: false } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={() => router.back()} title="Volver"><ArrowLeft size={20} /></button>
        <h1 style={styles.title}>
          <MessageSquare size={20} style={{ marginRight: 8, verticalAlign: "middle", color: "var(--accent-light)" }} />
          Consultar
        </h1>
      </div>

      <div style={styles.contextBar}>
        <span style={styles.contextLabel}>
          <Search size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Contexto:
        </span>
        <input
          type="date"
          value={contextDate}
          onChange={(e) => setContextDate(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.chipsRow}>
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            style={styles.chip}
            onClick={() => sendMessage(q)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
          >
            {q}
          </button>
        ))}
      </div>

      <div style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            <Bot size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>Pregunta lo que quieras sobre el informe del día</p>
          </div>
        )}
        {messages.map((msg) => {
          if (msg.role === "user") {
            return <div key={msg.id} style={styles.userBubble}>{msg.text}</div>;
          }
          return (
            <div key={msg.id} style={styles.aiBubbleRow}>
              <div style={styles.aiAvatar}>
                {msg.loading ? <Loader2 size={18} style={{ color: "var(--accent-light)", animation: "spin 1s linear infinite" }} /> : <Bot size={18} style={{ color: "var(--accent-light)" }} />}
              </div>
              <div style={styles.aiBubble}>{renderFormattedText(msg.text)}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputBar}>
        <input
          style={styles.input}
          placeholder="Escribe tu pregunta sobre el informe..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          style={{ ...styles.sendBtn, opacity: input.trim() && !sending ? 1 : 0.5 }}
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
