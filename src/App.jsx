import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { storage } from "./lib/storage.js";

/* ============================================================
   CRM SLOWPITCH — "Marcador" theme
   Paleta: noche de estadio bajo las luces
   bg #0B1210 · surface #131F1A · surface2 #1B2B24
   turf(verde pasto) #6EE07A · amber(caución) #E8A93C
   foul(alerta) #E85C4A · chalk(texto) #F5F3EC · muted #8FA69B
   Tipografía: Teko (scoreboard) + Inter (cuerpo) + IBM Plex Mono (datos)
   ============================================================ */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const STATUS_OPTS = ["Interesado", "Confirmado", "Pagado", "Fuera"];
const PAGO_OPTS = ["Sin abonar", "Abono", "Pagado"];
const VUELVEN_OPTS = ["Sin respuesta", "Sí", "No", "No sabe"];

const STATUS_COLOR = {
  Interesado: "#8FA69B",
  Confirmado: "#E8A93C",
  Pagado: "#6EE07A",
  Fuera: "#E85C4A",
};
const PAGO_COLOR = {
  "Sin abonar": "#E85C4A",
  Abono: "#E8A93C",
  Pagado: "#6EE07A",
};
const VUELVEN_COLOR = {
  "Sin respuesta": "#8FA69B",
  Sí: "#6EE07A",
  No: "#E85C4A",
  "No sabe": "#E8A93C",
};

const SEED_SCHEDULES = [
  { id: "normal", nombre: "Horario Normal", capacidadMaxima: 227, minimos: 192 },
  { id: "tempranera", nombre: "Tempranera", capacidadMaxima: 32, minimos: 20 },
  { id: "viernes-jueves", nombre: "Viernes - Jueves", capacidadMaxima: 60, minimos: 48 },
  { id: "sabatina", nombre: "Sabatina", capacidadMaxima: 84, minimos: 30 },
];

const SEED_LEAGUES = [
  { id: "varonil", nombre: "Varonil", horario: "normal", inscripcion: 15000, descuentos: 0, enConsumo: 2000 },
  { id: "femenil", nombre: "Femenil", horario: "normal", inscripcion: 14000, descuentos: 0, enConsumo: 1500 },
  { id: "varonil-tempranera", nombre: "Varonil Tempranera", horario: "tempranera", inscripcion: 13000, descuentos: 0, enConsumo: 1000 },
  { id: "femenil-tempranera", nombre: "Femenil Tempranera", horario: "tempranera", inscripcion: 13000, descuentos: 0, enConsumo: 1000 },
  { id: "viernes-varonil", nombre: "Viernes Varonil", horario: "viernes-jueves", inscripcion: 15000, descuentos: 0, enConsumo: 2000 },
  { id: "mixta-jueves", nombre: "Mixta Jueves", horario: "viernes-jueves", inscripcion: 15000, descuentos: 0, enConsumo: 2000 },
  { id: "mixta-viernes", nombre: "Mixta Viernes", horario: "viernes-jueves", inscripcion: 15000, descuentos: 0, enConsumo: 2000 },
  { id: "sabatina-femenil", nombre: "Sabatina Femenil", horario: "sabatina", inscripcion: 11000, descuentos: 0, enConsumo: 1000 },
  { id: "sabatina-varonil", nombre: "Sabatina Varonil", horario: "sabatina", inscripcion: 11000, descuentos: 0, enConsumo: 1000 },
  { id: "sabatina-mixta", nombre: "Sabatina Mixta", horario: "sabatina", inscripcion: 11000, descuentos: 0, enConsumo: 1000 },
];

const SEED_TEAMS = [
  {
    id: uid(),
    subdelegado: "",
    telSubdelegado: "",
    manager: "Alejandro Rosales",
    telManager: "6621490032",
    liga: "varonil-tempranera",
    nombreEquipo: "CECRA",
    nombreAnterior: "",
    roster: false,
    fotos: false,
    factura: "F8221",
    status: "Confirmado",
    valeConsumo: true,
    pago: "Pagado",
    observaciones: "",
  },
  {
    id: uid(),
    subdelegado: "",
    telSubdelegado: "",
    manager: "Jesus Alvarez",
    telManager: "6621482376",
    liga: "varonil-tempranera",
    nombreEquipo: "CAGUABICHI",
    nombreAnterior: "NUEVO",
    roster: false,
    fotos: false,
    factura: "F8223",
    status: "Confirmado",
    valeConsumo: false,
    pago: "Abono",
    observaciones: "",
  },
  {
    id: uid(),
    subdelegado: "Francisco Carrillo",
    telSubdelegado: "6629483017",
    manager: "Emilio Mendoza",
    telManager: "8115997782",
    liga: "sabatina-mixta",
    nombreEquipo: "COLSON",
    nombreAnterior: "NUEVO",
    roster: false,
    fotos: false,
    factura: "F8222",
    status: "Confirmado",
    valeConsumo: true,
    pago: "Pagado",
    observaciones: "",
  },
];

const SEED_RETURNING = [];

const money = (n) =>
  (n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const waLink = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${withCountry}`;
};

/* ---------- Signature element: base-diamond gauge ---------- */
function DiamondGauge({ pct, size = 84 }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const basesLit = Math.round((clamped / 100) * 4);
  // base positions on a diamond: home(bottom), first(right), second(top), third(left)
  const bases = [
    { key: "home", cx: 50, cy: 92 },
    { key: "first", cx: 92, cy: 50 },
    { key: "second", cx: 50, cy: 8 },
    { key: "third", cx: 8, cy: 50 },
  ];
  const order = ["home", "first", "second", "third"]; // running order
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon
          points="50,8 92,50 50,92 8,50"
          fill="none"
          stroke="#2A3B33"
          strokeWidth="2.5"
        />
        {bases.map((b) => {
          const idx = order.indexOf(b.key);
          const lit = idx < basesLit;
          return (
            <rect
              key={b.key}
              x={b.cx - 7}
              y={b.cy - 7}
              width="14"
              height="14"
              rx="2.5"
              transform={`rotate(45 ${b.cx} ${b.cy})`}
              fill={lit ? "#6EE07A" : "#1B2B24"}
              stroke={lit ? "#6EE07A" : "#2A3B33"}
              strokeWidth="1.5"
              style={{ transition: "fill 0.4s ease, stroke 0.4s ease" }}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <span style={{ fontFamily: "Teko, sans-serif", fontSize: size * 0.3, fontWeight: 600, color: "#F5F3EC", lineHeight: 1 }}>
          {clamped.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        color: color,
        background: color + "1E",
        border: `1px solid ${color}55`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, display: "inline-block" }} />
      {text}
    </span>
  );
}

function IconWA() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.8a8.1 8.1 0 0 1 8.1 8.11c0 4.47-3.63 8.1-8.1 8.1a8.1 8.1 0 0 1-4.12-1.13l-.3-.17-3.14.82.84-3.06-.19-.32a8.06 8.06 0 0 1-1.24-4.34 8.1 8.1 0 0 1 8.15-8.01m-4.42 4.6c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02s.87 2.35 1 2.51c.12.16 1.7 2.67 4.2 3.65 2.07.83 2.5.66 2.94.62.45-.04 1.44-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.13-1.44-.71-1.66-.79-.22-.08-.39-.13-.55.13-.16.24-.63.79-.78.96-.14.16-.29.18-.53.06-.24-.13-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.5.11-.11.24-.29.36-.43.12-.15.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.13-.55-1.35-.77-1.84-.19-.46-.4-.42-.55-.43z"/>
    </svg>
  );
}

/* ------------------------- App ------------------------- */
export default function CRMSlowpitch() {
  const [state, setState] = useState({ teams: SEED_TEAMS, leagues: SEED_LEAGUES, schedules: SEED_SCHEDULES, returning: SEED_RETURNING });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [teamModal, setTeamModal] = useState(null); // null | {} | team object
  const [returnModal, setReturnModal] = useState(null);
  const [filterLiga, setFilterLiga] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("crm-state");
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setState((s) => ({ ...s, ...parsed }));
        }
      } catch (e) {
        // no previous data — fine, keep seed
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await storage.set("crm-state", JSON.stringify(state));
      } catch (e) {
        setToast({ type: "error", msg: "No se pudo guardar. Intenta de nuevo." });
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const leagueById = useMemo(() => Object.fromEntries(state.leagues.map((l) => [l.id, l])), [state.leagues]);

  const teamsByLeague = useMemo(() => {
    const map = {};
    state.leagues.forEach((l) => (map[l.id] = []));
    state.teams.forEach((t) => {
      if (!map[t.liga]) map[t.liga] = [];
      map[t.liga].push(t);
    });
    return map;
  }, [state.teams, state.leagues]);

  const scheduleStats = useMemo(() => {
    return state.schedules.map((sch) => {
      const leaguesHere = state.leagues.filter((l) => l.horario === sch.id);
      let completados = 0;
      leaguesHere.forEach((l) => {
        completados += (teamsByLeague[l.id] || []).filter((t) => t.status !== "Fuera").length;
      });
      const pctMax = sch.capacidadMaxima ? (completados / sch.capacidadMaxima) * 100 : 0;
      const pctMin = sch.minimos ? (completados / sch.minimos) * 100 : 0;
      return {
        ...sch,
        completados,
        libres: Math.max(sch.capacidadMaxima - completados, 0),
        faltantes: Math.max(sch.minimos - completados, 0),
        pctMax,
        pctMin,
        leaguesHere,
      };
    });
  }, [state.schedules, state.leagues, teamsByLeague]);

  const leagueStats = useMemo(() => {
    return state.leagues.map((l) => {
      const ts = teamsByLeague[l.id] || [];
      return {
        ...l,
        interesados: ts.filter((t) => t.status === "Interesado").length,
        confirmados: ts.filter((t) => t.status === "Confirmado" || t.status === "Pagado").length,
        pagados: ts.filter((t) => t.pago === "Pagado").length,
        nuevos: ts.filter((t) => t.nombreAnterior && t.nombreAnterior.toUpperCase() === "NUEVO").length,
        fuera: ts.filter((t) => t.status === "Fuera").length,
        abonaron: ts.filter((t) => t.pago === "Abono" || t.pago === "Pagado").length,
        sinAbonar: ts.filter((t) => t.pago === "Sin abonar").length,
        total: ts.length,
      };
    });
  }, [state.leagues, teamsByLeague]);

  const totals = useMemo(() => {
    const capMax = scheduleStats.reduce((s, x) => s + x.capacidadMaxima, 0);
    const comp = scheduleStats.reduce((s, x) => s + x.completados, 0);
    const min = scheduleStats.reduce((s, x) => s + x.minimos, 0);
    const ingresoEsperado = state.teams
      .filter((t) => t.status !== "Fuera")
      .reduce((s, t) => {
        const l = leagueById[t.liga];
        return s + (l ? l.inscripcion - (l.descuentos || 0) : 0);
      }, 0);
    const ingresoCobrado = state.teams
      .filter((t) => t.pago === "Pagado")
      .reduce((s, t) => {
        const l = leagueById[t.liga];
        return s + (l ? l.inscripcion - (l.descuentos || 0) : 0);
      }, 0);
    return { capMax, comp, min, pct: capMax ? (comp / capMax) * 100 : 0, ingresoEsperado, ingresoCobrado };
  }, [scheduleStats, state.teams, leagueById]);

  const filteredTeams = useMemo(() => {
    return state.teams.filter((t) => {
      if (filterLiga !== "todas" && t.liga !== filterLiga) return false;
      if (filterStatus !== "todos" && t.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.nombreEquipo} ${t.manager} ${t.telManager} ${t.subdelegado}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [state.teams, filterLiga, filterStatus, search]);

  const saveTeam = useCallback((team) => {
    setState((s) => {
      const exists = s.teams.some((t) => t.id === team.id);
      return {
        ...s,
        teams: exists ? s.teams.map((t) => (t.id === team.id ? team : t)) : [...s.teams, { ...team, id: team.id || uid() }],
      };
    });
    setTeamModal(null);
    setToast({ type: "ok", msg: "Equipo guardado." });
  }, []);

  const deleteTeam = useCallback((id) => {
    setState((s) => ({ ...s, teams: s.teams.filter((t) => t.id !== id) }));
    setTeamModal(null);
    setToast({ type: "ok", msg: "Equipo eliminado." });
  }, []);

  const saveReturning = useCallback((r) => {
    setState((s) => {
      const exists = s.returning.some((x) => x.id === r.id);
      return {
        ...s,
        returning: exists ? s.returning.map((x) => (x.id === r.id ? r : x)) : [...s.returning, { ...r, id: r.id || uid() }],
      };
    });
    setReturnModal(null);
    setToast({ type: "ok", msg: "Registro guardado." });
  }, []);

  const deleteReturning = useCallback((id) => {
    setState((s) => ({ ...s, returning: s.returning.filter((x) => x.id !== id) }));
    setReturnModal(null);
    setToast({ type: "ok", msg: "Registro eliminado." });
  }, []);

  const updateLeague = useCallback((id, patch) => {
    setState((s) => ({ ...s, leagues: s.leagues.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);

  const updateSchedule = useCallback((id, patch) => {
    setState((s) => ({ ...s, schedules: s.schedules.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)) }));
  }, []);

  const TABS = [
    { id: "dashboard", label: "Tablero" },
    { id: "equipos", label: "Equipos" },
    { id: "ligas", label: "Ligas y precios" },
    { id: "regresos", label: "Equipos que regresan" },
  ];

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: "#0B1210",
        color: "#F5F3EC",
        minHeight: "100%",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        .crm-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .crm-scroll::-webkit-scrollbar-thumb { background: #2A3B33; border-radius: 8px; }
        .crm-row:hover { background: #1B2B24 !important; }
        .crm-btn { transition: transform .12s ease, background .15s ease, border-color .15s ease; }
        .crm-btn:hover { transform: translateY(-1px); }
        .crm-btn:active { transform: translateY(0); }
        .crm-input:focus, .crm-select:focus { outline: 2px solid #6EE07A; outline-offset: 1px; }
        .crm-tab { transition: color .15s ease, border-color .15s ease; }
        @media (prefers-reduced-motion: reduce) {
          .crm-btn, .crm-tab, * { transition: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "22px 26px 0", borderBottom: "1px solid #1F2E27" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: "Teko, sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: 0.5, color: "#6EE07A", lineHeight: 1 }}>
              CRM BLD MEXICO
            </span>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#8FA69B" }}>
              Temporada 3 · 2026
            </span>
          </div>
          <div style={{ display: "flex", gap: 18, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#8FA69B" }}>
            <span>Equipos activos <b style={{ color: "#F5F3EC" }}>{state.teams.filter((t) => t.status !== "Fuera").length}</b></span>
            <span>Cupo total <b style={{ color: "#F5F3EC" }}>{totals.comp}/{totals.capMax}</b></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 18 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className="crm-tab"
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2.5px solid #6EE07A" : "2.5px solid transparent",
                color: tab === t.id ? "#F5F3EC" : "#8FA69B",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                padding: "8px 4px 12px",
                marginRight: 22,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 26 }}>
        {tab === "dashboard" && (
          <Dashboard scheduleStats={scheduleStats} leagueStats={leagueStats} totals={totals} />
        )}
        {tab === "equipos" && (
          <Equipos
            leagues={state.leagues}
            filteredTeams={filteredTeams}
            filterLiga={filterLiga}
            setFilterLiga={setFilterLiga}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            search={search}
            setSearch={setSearch}
            openNew={() => setTeamModal({})}
            openEdit={(t) => setTeamModal(t)}
            leagueById={leagueById}
          />
        )}
        {tab === "ligas" && (
          <Ligas leagues={state.leagues} schedules={state.schedules} updateLeague={updateLeague} updateSchedule={updateSchedule} leagueStats={leagueStats} />
        )}
        {tab === "regresos" && (
          <Regresos rows={state.returning} openNew={() => setReturnModal({})} openEdit={(r) => setReturnModal(r)} />
        )}
      </div>

      {teamModal !== null && (
        <TeamModal
          team={teamModal}
          leagues={state.leagues}
          onSave={saveTeam}
          onDelete={deleteTeam}
          onClose={() => setTeamModal(null)}
        />
      )}
      {returnModal !== null && (
        <ReturnModal row={returnModal} onSave={saveReturning} onDelete={deleteReturning} onClose={() => setReturnModal(null)} />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: toast.type === "error" ? "#E85C4A" : "#6EE07A",
            color: "#0B1210",
            padding: "10px 16px",
            borderRadius: 8,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ------------------------- Dashboard ------------------------- */
function Dashboard({ scheduleStats, leagueStats, totals }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 26 }}>
        {scheduleStats.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#131F1A",
              border: "1px solid #1F2E27",
              borderRadius: 10,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <DiamondGauge pct={s.pctMax} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "Teko, sans-serif", fontSize: 20, fontWeight: 600, color: "#F5F3EC", lineHeight: 1.1 }}>
                {s.nombre}
              </div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#8FA69B", marginTop: 4 }}>
                {s.completados} / {s.capacidadMaxima} equipos
              </div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: s.faltantes > 0 ? "#E8A93C" : "#6EE07A", marginTop: 2 }}>
                {s.faltantes > 0 ? `Faltan ${s.faltantes} p/ mínimo` : "Mínimo cubierto"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 26 }}>
        <StatPill label="Total inscritos" value={totals.comp} sub={`de ${totals.capMax} cupos`} />
        <StatPill label="Avance general" value={`${totals.pct.toFixed(1)}%`} sub="de capacidad máxima" />
        <StatPill label="Ingreso esperado" value={money(totals.ingresoEsperado)} sub="equipos activos" />
        <StatPill label="Ingreso cobrado" value={money(totals.ingresoCobrado)} sub="pagos completos" />
      </div>

      <div style={{ fontFamily: "Teko, sans-serif", fontSize: 22, fontWeight: 600, marginBottom: 10, color: "#F5F3EC" }}>
        Resumen por liga
      </div>
      <div className="crm-scroll" style={{ overflowX: "auto", border: "1px solid #1F2E27", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#131F1A", textAlign: "left" }}>
              {["Liga", "Interesados", "Confirmados", "Pagados", "Nuevos", "Abonaron", "Sin abonar", "Fuera", "Total"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", color: "#8FA69B", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leagueStats.map((l) => (
              <tr key={l.id} className="crm-row" style={{ borderTop: "1px solid #1F2E27" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{l.nombre}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{l.interesados}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{l.confirmados}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace", color: "#6EE07A" }}>{l.pagados}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{l.nuevos}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{l.abonaron}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace", color: l.sinAbonar > 0 ? "#E85C4A" : "#8FA69B" }}>{l.sinAbonar}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{l.fuera}</td>
                <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace", fontWeight: 700 }}>{l.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatPill({ label, value, sub }) {
  return (
    <div style={{ background: "#131F1A", border: "1px solid #1F2E27", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#8FA69B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: "Teko, sans-serif", fontSize: 30, fontWeight: 600, color: "#F5F3EC", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#8FA69B" }}>{sub}</div>
    </div>
  );
}

/* ------------------------- Exportar (para pegar en Google Sheets) ------------------------- */
function buildTSV(teams, leagueById) {
  const headers = ["Subdelegado", "Telefono Subdelegado", "Nombre Manager", "Telefono", "Liga", "Nombre del Equipo", "Nombre Anterior", "Roster", "Fotos", "Factura", "Status", "Vale de Consumo", "Pago", "Observaciones"];
  const rows = teams.map((t) => [
    t.subdelegado, t.telSubdelegado, t.manager, t.telManager,
    leagueById[t.liga] ? leagueById[t.liga].nombre : t.liga,
    t.nombreEquipo, t.nombreAnterior, t.roster ? "SI" : "", t.fotos ? "SI" : "",
    t.factura, t.status, t.valeConsumo ? "SI" : "NO", t.pago, t.observaciones,
  ]);
  return [headers, ...rows].map((r) => r.map((c) => (c === undefined || c === null ? "" : String(c))).join("\t")).join("\n");
}

function ExportModal({ tsv, onClose }) {
  const taRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      if (taRef.current) {
        taRef.current.select();
        document.execCommand("copy");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // selection copy is enough as fallback
    }
  };
  return (
    <ModalShell title="Exportar equipos" onClose={onClose} width={640}>
      <p style={{ fontSize: 13, color: "#8FA69B", marginTop: 0, marginBottom: 10 }}>
        Copia esta tabla y pégala directamente en una hoja de Google Sheets (respeta columnas y filas automáticamente).
      </p>
      <textarea
        ref={taRef}
        readOnly
        value={tsv}
        onClick={(e) => e.target.select()}
        style={{ ...fieldStyle(), minHeight: 220, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, resize: "vertical" }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
        <button
          className="crm-btn"
          onClick={doCopy}
          style={{ background: "#6EE07A", color: "#0B1210", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          {copied ? "¡Copiado!" : "Copiar al portapapeles"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------- Equipos ------------------------- */
function Equipos({ leagues, filteredTeams, filterLiga, setFilterLiga, filterStatus, setFilterStatus, search, setSearch, openNew, openEdit, leagueById }) {
  const [exportOpen, setExportOpen] = useState(false);
  const selectStyle = {
    background: "#131F1A",
    border: "1px solid #2A3B33",
    color: "#F5F3EC",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          className="crm-input"
          placeholder="Buscar equipo, manager o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...selectStyle, minWidth: 220, flex: "1 1 220px" }}
        />
        <select className="crm-select" value={filterLiga} onChange={(e) => setFilterLiga(e.target.value)} style={selectStyle}>
          <option value="todas">Todas las ligas</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>{l.nombre}</option>
          ))}
        </select>
        <select className="crm-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="todos">Todos los estatus</option>
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          className="crm-btn"
          onClick={() => setExportOpen(true)}
          style={{
            marginLeft: "auto",
            background: "transparent",
            color: "#F5F3EC",
            border: "1px solid #2A3B33",
            borderRadius: 8,
            padding: "9px 16px",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Exportar a Sheets
        </button>
        <button
          className="crm-btn"
          onClick={openNew}
          style={{
            background: "#6EE07A",
            color: "#0B1210",
            border: "none",
            borderRadius: 8,
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + Nuevo equipo
        </button>
      </div>
      {exportOpen && <ExportModal tsv={buildTSV(filteredTeams, leagueById)} onClose={() => setExportOpen(false)} />}

      <div className="crm-scroll" style={{ overflowX: "auto", border: "1px solid #1F2E27", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 13, minWidth: 920 }}>
          <thead>
            <tr style={{ background: "#131F1A", textAlign: "left" }}>
              {["Equipo", "Liga", "Manager", "Contacto", "Factura", "Estatus", "Pago", "Vale consumo", ""].map((h) => (
                <th key={h} style={{ padding: "10px 12px", color: "#8FA69B", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "26px 12px", textAlign: "center", color: "#8FA69B" }}>
                  Sin equipos con estos filtros. Ajusta la búsqueda o registra uno nuevo.
                </td>
              </tr>
            )}
            {filteredTeams.map((t) => {
              const l = leagueById[t.liga];
              const wa = waLink(t.telManager);
              return (
                <tr key={t.id} className="crm-row" style={{ borderTop: "1px solid #1F2E27", cursor: "pointer" }} onClick={() => openEdit(t)}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {t.nombreEquipo}
                    {t.nombreAnterior && t.nombreAnterior.toUpperCase() === "NUEVO" && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: "#E8A93C", fontFamily: "IBM Plex Mono, monospace" }}>NUEVO</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#8FA69B" }}>{l ? l.nombre : t.liga}</td>
                  <td style={{ padding: "10px 12px" }}>{t.manager}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "#6EE07A", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                      >
                        <IconWA /> {t.telManager}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{t.factura || "—"}</td>
                  <td style={{ padding: "10px 12px" }}><Badge text={t.status} color={STATUS_COLOR[t.status]} /></td>
                  <td style={{ padding: "10px 12px" }}><Badge text={t.pago} color={PAGO_COLOR[t.pago]} /></td>
                  <td style={{ padding: "10px 12px" }}>{t.valeConsumo ? "Sí" : "No"}</td>
                  <td style={{ padding: "10px 12px", color: "#8FA69B" }}>Editar →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fieldStyle() {
  return {
    width: "100%",
    background: "#0B1210",
    border: "1px solid #2A3B33",
    color: "#F5F3EC",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
  };
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 11, color: "#8FA69B", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ModalShell({ title, onClose, onDelete, children, width = 520 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,8,6,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 900,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="crm-scroll"
        style={{
          background: "#131F1A",
          border: "1px solid #2A3B33",
          borderRadius: 12,
          width: "100%",
          maxWidth: width,
          maxHeight: "88vh",
          overflowY: "auto",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "Teko, sans-serif", fontSize: 24, fontWeight: 600, color: "#F5F3EC" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8FA69B", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
        {onDelete && (
          <button
            className="crm-btn"
            onClick={onDelete}
            style={{ marginTop: 6, background: "transparent", border: "1px solid #E85C4A55", color: "#E85C4A", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Eliminar registro
          </button>
        )}
      </div>
    </div>
  );
}

function TeamModal({ team, leagues, onSave, onDelete, onClose }) {
  const isNew = !team.id;
  const [form, setForm] = useState({
    id: team.id || "",
    subdelegado: team.subdelegado || "",
    telSubdelegado: team.telSubdelegado || "",
    manager: team.manager || "",
    telManager: team.telManager || "",
    liga: team.liga || leagues[0]?.id || "",
    nombreEquipo: team.nombreEquipo || "",
    nombreAnterior: team.nombreAnterior || "",
    roster: !!team.roster,
    fotos: !!team.fotos,
    factura: team.factura || "",
    status: team.status || "Interesado",
    valeConsumo: !!team.valeConsumo,
    pago: team.pago || "Sin abonar",
    observaciones: team.observaciones || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalShell title={isNew ? "Nuevo equipo" : "Editar equipo"} onClose={onClose} onDelete={isNew ? null : () => onDelete(team.id)}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nombre del equipo"><input style={fieldStyle()} value={form.nombreEquipo} onChange={(e) => set("nombreEquipo", e.target.value)} /></Field>
        <Field label="Nombre anterior">
          <input style={fieldStyle()} value={form.nombreAnterior} onChange={(e) => set("nombreAnterior", e.target.value)} placeholder="NUEVO si aplica" />
        </Field>
        <Field label="Liga">
          <select style={fieldStyle()} value={form.liga} onChange={(e) => set("liga", e.target.value)}>
            {leagues.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </Field>
        <Field label="Factura"><input style={fieldStyle()} value={form.factura} onChange={(e) => set("factura", e.target.value)} /></Field>
        <Field label="Manager"><input style={fieldStyle()} value={form.manager} onChange={(e) => set("manager", e.target.value)} /></Field>
        <Field label="Teléfono manager"><input style={fieldStyle()} value={form.telManager} onChange={(e) => set("telManager", e.target.value)} placeholder="10 dígitos" /></Field>
        <Field label="Subdelegado (opcional)"><input style={fieldStyle()} value={form.subdelegado} onChange={(e) => set("subdelegado", e.target.value)} /></Field>
        <Field label="Teléfono subdelegado"><input style={fieldStyle()} value={form.telSubdelegado} onChange={(e) => set("telSubdelegado", e.target.value)} /></Field>
        <Field label="Estatus">
          <select style={fieldStyle()} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Pago">
          <select style={fieldStyle()} value={form.pago} onChange={(e) => set("pago", e.target.value)}>
            {PAGO_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 20, margin: "6px 0 14px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
          <input type="checkbox" checked={form.roster} onChange={(e) => set("roster", e.target.checked)} /> Roster entregado
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
          <input type="checkbox" checked={form.fotos} onChange={(e) => set("fotos", e.target.checked)} /> Fotos entregadas
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
          <input type="checkbox" checked={form.valeConsumo} onChange={(e) => set("valeConsumo", e.target.checked)} /> Vale de consumo
        </label>
      </div>
      <Field label="Observaciones">
        <textarea style={{ ...fieldStyle(), minHeight: 60, resize: "vertical" }} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="crm-btn" onClick={onClose} style={{ background: "transparent", border: "1px solid #2A3B33", color: "#8FA69B", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        <button
          className="crm-btn"
          onClick={() => {
            if (!form.nombreEquipo.trim()) return;
            onSave(form);
          }}
          style={{ background: "#6EE07A", color: "#0B1210", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Guardar equipo
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------- Ligas y precios ------------------------- */
function Ligas({ leagues, schedules, updateLeague, updateSchedule, leagueStats }) {
  const cellInput = {
    width: "100%",
    background: "#0B1210",
    border: "1px solid #2A3B33",
    color: "#F5F3EC",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 12,
    fontFamily: "IBM Plex Mono, monospace",
    boxSizing: "border-box",
  };
  return (
    <div>
      <div style={{ fontFamily: "Teko, sans-serif", fontSize: 22, fontWeight: 600, marginBottom: 10 }}>Capacidad por horario</div>
      <div className="crm-scroll" style={{ overflowX: "auto", border: "1px solid #1F2E27", borderRadius: 10, marginBottom: 26 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#131F1A", textAlign: "left" }}>
              {["Horario", "Capacidad máxima", "Mínimos"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", color: "#8FA69B", fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid #1F2E27" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.nombre}</td>
                <td style={{ padding: "8px 12px", width: 140 }}>
                  <input type="number" style={cellInput} value={s.capacidadMaxima} onChange={(e) => updateSchedule(s.id, { capacidadMaxima: Number(e.target.value) || 0 })} />
                </td>
                <td style={{ padding: "8px 12px", width: 140 }}>
                  <input type="number" style={cellInput} value={s.minimos} onChange={(e) => updateSchedule(s.id, { minimos: Number(e.target.value) || 0 })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontFamily: "Teko, sans-serif", fontSize: 22, fontWeight: 600, marginBottom: 10 }}>Ligas y precios</div>
      <div className="crm-scroll" style={{ overflowX: "auto", border: "1px solid #1F2E27", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 13, minWidth: 780 }}>
          <thead>
            <tr style={{ background: "#131F1A", textAlign: "left" }}>
              {["Liga", "Horario", "Inscripción", "Descuento", "A pagar", "En consumo", "Equipos"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", color: "#8FA69B", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leagues.map((l) => {
              const sch = schedules.find((s) => s.id === l.horario);
              const stat = leagueStats.find((x) => x.id === l.id);
              const aPagar = (l.inscripcion || 0) - (l.descuentos || 0);
              return (
                <tr key={l.id} style={{ borderTop: "1px solid #1F2E27" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{l.nombre}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <select style={{ ...cellInput, fontFamily: "Inter, sans-serif" }} value={l.horario} onChange={(e) => updateLeague(l.id, { horario: e.target.value })}>
                      {schedules.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "8px 12px", width: 120 }}>
                    <input type="number" style={cellInput} value={l.inscripcion} onChange={(e) => updateLeague(l.id, { inscripcion: Number(e.target.value) || 0 })} />
                  </td>
                  <td style={{ padding: "8px 12px", width: 110 }}>
                    <input type="number" style={cellInput} value={l.descuentos} onChange={(e) => updateLeague(l.id, { descuentos: Number(e.target.value) || 0 })} />
                  </td>
                  <td style={{ padding: "8px 12px", fontFamily: "IBM Plex Mono, monospace", color: "#6EE07A" }}>{money(aPagar)}</td>
                  <td style={{ padding: "8px 12px", width: 120 }}>
                    <input type="number" style={cellInput} value={l.enConsumo} onChange={(e) => updateLeague(l.id, { enConsumo: Number(e.target.value) || 0 })} />
                  </td>
                  <td style={{ padding: "8px 12px", fontFamily: "IBM Plex Mono, monospace" }}>{stat ? stat.total : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------- Regresos ------------------------- */
function Regresos({ rows, openNew, openEdit }) {
  const counts = useMemo(() => {
    const c = { Sí: 0, No: 0, "No sabe": 0, "Sin respuesta": 0 };
    rows.forEach((r) => { c[r.vanAVolver] = (c[r.vanAVolver] || 0) + 1; });
    return c;
  }, [rows]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 22 }}>
        {Object.entries(counts).map(([k, v]) => (
          <StatPill key={k} label={k} value={v} sub="equipos" />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          className="crm-btn"
          onClick={openNew}
          style={{ background: "#6EE07A", color: "#0B1210", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          + Registrar seguimiento
        </button>
      </div>

      <div className="crm-scroll" style={{ overflowX: "auto", border: "1px solid #1F2E27", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ background: "#131F1A", textAlign: "left" }}>
              {["Manager", "Teléfono", "Categoría", "Equipo", "¿Va a volver?", "Confirmado", "Observaciones", ""].map((h) => (
                <th key={h} style={{ padding: "10px 12px", color: "#8FA69B", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "26px 12px", textAlign: "center", color: "#8FA69B" }}>
                  Aún no hay seguimientos de equipos que regresan. Registra el primero.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const wa = waLink(r.telefono);
              return (
                <tr key={r.id} className="crm-row" style={{ borderTop: "1px solid #1F2E27", cursor: "pointer" }} onClick={() => openEdit(r)}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.manager}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace" }}>
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "#6EE07A", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                        <IconWA /> {r.telefono}
                      </a>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{r.categoria}</td>
                  <td style={{ padding: "10px 12px" }}>{r.equipo}</td>
                  <td style={{ padding: "10px 12px" }}><Badge text={r.vanAVolver} color={VUELVEN_COLOR[r.vanAVolver]} /></td>
                  <td style={{ padding: "10px 12px" }}>{r.confirmado ? "Sí" : "No"}</td>
                  <td style={{ padding: "10px 12px", color: "#8FA69B", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.observaciones}</td>
                  <td style={{ padding: "10px 12px", color: "#8FA69B" }}>Editar →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReturnModal({ row, onSave, onDelete, onClose }) {
  const isNew = !row.id;
  const [form, setForm] = useState({
    id: row.id || "",
    manager: row.manager || "",
    telefono: row.telefono || "",
    categoria: row.categoria || "",
    equipo: row.equipo || "",
    vanAVolver: row.vanAVolver || "Sin respuesta",
    confirmado: !!row.confirmado,
    observaciones: row.observaciones || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalShell title={isNew ? "Nuevo seguimiento" : "Editar seguimiento"} onClose={onClose} onDelete={isNew ? null : () => onDelete(row.id)} width={460}>
      <Field label="Manager"><input style={fieldStyle()} value={form.manager} onChange={(e) => set("manager", e.target.value)} /></Field>
      <Field label="Teléfono"><input style={fieldStyle()} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="10 dígitos" /></Field>
      <Field label="Categoría"><input style={fieldStyle()} value={form.categoria} onChange={(e) => set("categoria", e.target.value)} /></Field>
      <Field label="Equipo"><input style={fieldStyle()} value={form.equipo} onChange={(e) => set("equipo", e.target.value)} /></Field>
      <Field label="¿Va a volver?">
        <select style={fieldStyle()} value={form.vanAVolver} onChange={(e) => set("vanAVolver", e.target.value)}>
          {VUELVEN_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, margin: "4px 0 14px" }}>
        <input type="checkbox" checked={form.confirmado} onChange={(e) => set("confirmado", e.target.checked)} /> Confirmado
      </label>
      <Field label="Observaciones">
        <textarea style={{ ...fieldStyle(), minHeight: 60, resize: "vertical" }} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="crm-btn" onClick={onClose} style={{ background: "transparent", border: "1px solid #2A3B33", color: "#8FA69B", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        <button
          className="crm-btn"
          onClick={() => { if (!form.manager.trim() && !form.equipo.trim()) return; onSave(form); }}
          style={{ background: "#6EE07A", color: "#0B1210", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Guardar
        </button>
      </div>
    </ModalShell>
  );
}
