"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, EyeOff, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        setError("Codigo incorrecto");
      }
    } catch {
      setError("Error de conexion. Intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-page)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={28} color="var(--white)" />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Panel Consulta
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Acceso al panel de gestion clinica
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              htmlFor="code"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Lock size={14} color="var(--text-muted)" />
              Codigo de acceso
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="code"
                type={showPassword ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Introduce tu codigo"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 16px",
                  backgroundColor: "var(--bg-surface)",
                  border: `1px solid ${error ? "var(--danger)" : "var(--border-light)"}`,
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  if (!error) {
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }
                }}
                onBlur={(e) => {
                  if (!error) {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} color="var(--text-muted)" />
                ) : (
                  <Eye size={18} color="var(--text-muted)" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "8px",
              }}
            >
              <AlertCircle size={16} color="var(--danger)" />
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--danger)",
                  fontWeight: 500,
                }}
              >
                {error}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor:
                loading || !code.trim() ? "var(--muted)" : "var(--accent)",
              color: "var(--white)",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              transition: "background-color 0.2s, opacity 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            margin: 0,
            textAlign: "center",
          }}
        >
          Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  );
}
