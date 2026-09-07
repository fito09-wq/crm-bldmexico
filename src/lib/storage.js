// Reemplazo de window.storage (exclusivo de Claude) usando Supabase como
// base de datos real, para que el CRM funcione fuera de Claude.
// Guarda todo el estado del CRM como un único registro JSON, igual que
// hacía window.storage con la clave "crm-state".

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env o las variables de entorno en Vercel."
    );
  }
}

async function get(key) {
  assertConfigured();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_state?id=eq.${encodeURIComponent(key)}&select=data`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error("No se pudo leer la base de datos.");
  const rows = await res.json();
  if (!rows.length) return null;
  return { value: JSON.stringify(rows[0].data) };
}

async function set(key, value) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_state`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([{ id: key, data: JSON.parse(value), updated_at: new Date().toISOString() }]),
  });
  if (!res.ok) throw new Error("No se pudo guardar en la base de datos.");
  return { key, value };
}

export const storage = { get, set };
