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
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <form
        onSubmit={tryUnlock}
        style={{
          background: "#FFFFFF",
          border: "1px solid #E3E7ED",
          borderRadius: 12,
          padding: 32,
          width: 320,
          boxShadow: "0 10px 40px rgba(22,33,46,0.10)",
          textAlign: "center",
        }}
      >
        <img src="/logo-bld.png" alt="BLD - Big League Dreams" style={{ height: 90, width: "auto", margin: "0 auto 14px" }} />
        <div style={{ fontFamily: "Teko, sans-serif", fontSize: 24, fontWeight: 700, color: "#1F3A5F", marginBottom: 16 }}>
          CRM BLD MEXICO
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
            background: "#F6F8FA",
            border: "1px solid #D7DCE3",
            color: "#16212E",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 14,
            marginBottom: 10,
            textAlign: "left",
          }}
        />
        {error && <div style={{ color: "#C8202F", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#1F3A5F",
            color: "#FFFFFF",
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
