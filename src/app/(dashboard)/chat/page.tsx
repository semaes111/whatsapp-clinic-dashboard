"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  ChevronDown,
  Search,
  MessageSquare,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

const suggestedQuestions = [
  "\u00bfQui\u00e9n cancel\u00f3 hoy?",
  "\u00bfCu\u00e1ntos confirmaron?",
  "\u00bfQu\u00e9 queda pendiente?",
  "\u00bfQui\u00e9n no tiene cita?",
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    text: "\u00bfQui\u00e9n cancel\u00f3 hoy y por qu\u00e9?",
  },
  {
    id: 2,
    role: "assistant",
    text: "Hoy hubo 2 cancelaciones:\n\n1. **Yolanda Rubi** \u2014 Cancel\u00f3 por motivos personales. Ya se ha reagendado su cita para el 11 de febrero.\n\n2. **Elena Aguado** \u2014 No acudi\u00f3 a su cita y no respondi\u00f3 a los mensajes de confirmaci\u00f3n. No tiene nueva cita asignada. Es la tercera cancelaci\u00f3n en los \u00faltimos 2 meses. Requiere seguimiento prioritario.",
  },
  {
    id: 3,
    role: "user",
    text: "\u00bfCu\u00e1ntas veces ha cancelado Elena en los \u00faltimos 3 meses?",
  },
  {
    id: 4,
    role: "assistant",
    text: "**Elena Aguado** ha cancelado **3 veces** en los \u00faltimos 3 meses:\n\n\u2022 5 de diciembre \u2014 Cancel\u00f3 el mismo d\u00eda (motivo: \u201cno puedo ir\u201d)\n\u2022 14 de enero \u2014 No acudi\u00f3, no avis\u00f3\n\u2022 3 de febrero (hoy) \u2014 No acudi\u00f3, sin respuesta a confirmaci\u00f3n\n\nTasa de cancelaci\u00f3n: **75%** (3 de 4 citas programadas). Se recomienda contacto telef\u00f3nico directo y considerar pol\u00edtica de cita con dep\u00f3sito.",
  },
  {
    id: 5,
    role: "user",
    text: "\u00bfHay pacientes que dijeron \u2018ya te aviso\u2019 y no tienen cita puesta?",
  },
  {
    id: 6,
    role: "assistant",
    text: "S\u00ed, hay **2 pacientes** en esa situaci\u00f3n:\n\n1. **Eva M\u00aa Madero** \u2014 Recibi\u00f3 presupuesto de ortodoncia hace 10 d\u00edas. Respondi\u00f3 \u201cya te aviso\u201d el 24 de enero. No tiene cita programada.\n\n2. **Francisco Javier Criado** \u2014 Recibi\u00f3 presupuesto de implante hace 2 semanas. Respondi\u00f3 \u201cya te aviso\u201d. Sin cita. Posible p\u00e9rdida de paciente.\n\nRecomendaci\u00f3n: Enviar mensaje de seguimiento amable a ambos, ofrecer facilidades de financiaci\u00f3n y resolver posibles dudas.",
  },
];

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 64px)",
    maxWidth: 820,
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexShrink: 0,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
    flex: 1,
  },
  contextBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    marginBottom: 12,
    flexShrink: 0,
  },
  contextLabel: {
    fontSize: 13,
    color: "var(--text-muted)",
    whiteSpace: "nowrap" as const,
  },
  select: {
    flex: 1,
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: "none",
  },
  chipsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    marginBottom: 16,
    flexShrink: 0,
  },
  chip: {
    padding: "7px 14px",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
    borderRadius: 20,
    fontSize: 13,
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto" as const,
    paddingRight: 4,
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    paddingBottom: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "var(--accent)",
    color: "var(--white)",
    padding: "12px 18px",
    borderRadius: "18px 18px 4px 18px",
    maxWidth: "75%",
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
  aiBubbleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    maxWidth: "85%",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiBubble: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    padding: "14px 18px",
    borderRadius: "18px 18px 18px 4px",
    fontSize: 14,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap" as const,
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    marginTop: 8,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontSize: 14,
    padding: "4px 0",
  },
  sendBtn: {
    backgroundColor: "var(--accent)",
    border: "none",
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--white)",
    transition: "background 0.15s",
  },
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function renderFormattedText(text: string) {
  // Very simple markdown-like rendering for bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "var(--text-primary)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

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
  const reportDate = searchParams.get("report") || "2026-02-03";

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [contextDate, setContextDate] = useState(reportDate);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    const aiMsg: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: `Procesando tu consulta sobre el informe del ${contextDate}...\n\nEsta es una respuesta de ejemplo. En produccion, la IA analizaria las conversaciones y datos del dia para darte una respuesta precisa.`,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  const handleChipClick = (question: string) => {
    setInput(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.page}>
      {/* ---- HEADER ---- */}
      <div style={styles.headerRow}>
        <button
          style={styles.backBtn}
          onClick={() => router.back()}
          title="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={styles.title}>
          <MessageSquare
            size={20}
            style={{ marginRight: 8, verticalAlign: "middle", color: "var(--accent-light)" }}
          />
          Consultar
        </h1>
      </div>

      {/* ---- CONTEXT SELECTOR ---- */}
      <div style={styles.contextBar}>
        <span style={styles.contextLabel}>
          <Search size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Contexto:
        </span>
        <select
          value={contextDate}
          onChange={(e) => setContextDate(e.target.value)}
          style={styles.select}
        >
          <option value="2026-02-03">Informe 3 feb 2026</option>
          <option value="2026-02-02">Informe 2 feb 2026</option>
          <option value="2026-02-01">Informe 1 feb 2026</option>
          <option value="2026-01-31">Informe 31 ene 2026</option>
        </select>
      </div>

      {/* ---- SUGGESTED QUESTIONS ---- */}
      <div style={styles.chipsRow}>
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            style={styles.chip}
            onClick={() => handleChipClick(q)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-surface)";
              e.currentTarget.style.borderColor = "var(--border-light)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ---- MESSAGES ---- */}
      <div style={styles.messagesArea}>
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} style={styles.userBubble}>
                {msg.text}
              </div>
            );
          }
          return (
            <div key={msg.id} style={styles.aiBubbleRow}>
              <div style={styles.aiAvatar}>
                <Bot size={18} style={{ color: "var(--accent-light)" }} />
              </div>
              <div style={styles.aiBubble}>
                {renderFormattedText(msg.text)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- INPUT BAR ---- */}
      <div style={styles.inputBar}>
        <input
          style={styles.input}
          placeholder="Escribe tu pregunta sobre el informe..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={{
            ...styles.sendBtn,
            opacity: input.trim() ? 1 : 0.5,
          }}
          onClick={handleSend}
          disabled={!input.trim()}
          onMouseEnter={(e) => {
            if (input.trim())
              e.currentTarget.style.backgroundColor = "var(--accent-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent)";
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
