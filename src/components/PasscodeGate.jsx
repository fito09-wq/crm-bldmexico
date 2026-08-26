import React, { useState } from "react";

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || "";

export default function PasscodeGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("crm-auth") === "1");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  if (unlocked) return children;

  const tryUnlock = (e) => {
    e.preventDefault();
    if (!APP_PASSWORD) {
      setError("No se configuró VITE_APP_PASSWORD en el proyecto.");
      return;
    }
    if (input === APP_PASSWORD) {
      sessionStorage.setItem("crm-auth", "1");
      setUnlocked(true);
    } else {
      setError("Contraseña incorrecta.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1210",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <form
        onSubmit={tryUnlock}
        style={{
          background: "#131F1A",
          border: "1px solid #1F2E27",
          borderRadius: 12,
          padding: 28,
          width: 300,
        }}
      >
        <div style={{ fontFamily: "Teko, sans-serif", fontSize: 26, fontWeight: 700, color: "#6EE07A", marginBottom: 14 }}>
          DIAMANTE CRM
        </div>
        <input
          type="password"
          autoFocus
          placeholder="Contraseña"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#0B1210",
            border: "1px solid #2A3B33",
            color: "#F5F3EC",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 14,
            marginBottom: 10,
          }}
        />
        {error && <div style={{ color: "#E85C4A", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#6EE07A",
            color: "#0B1210",
            border: "none",
            borderRadius: 8,
            padding: "10px 12px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
