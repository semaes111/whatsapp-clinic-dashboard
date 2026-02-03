"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InformePage() {
  const router = useRouter();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    router.replace(`/informe/${today}`);
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        color: "var(--text-muted)",
        fontSize: 15,
      }}
    >
      Redirigiendo al informe de hoy...
    </div>
  );
}
