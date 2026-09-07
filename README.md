# Diamante CRM — listo para publicar

Este proyecto ya está armado y probado (compila sin errores). Solo te faltan
los pasos de "conectar cuentas" — ninguno requiere programar.

## 1. Crea la base de datos (Supabase, gratis)

1. Entra a https://supabase.com y crea una cuenta gratis.
2. Crea un proyecto nuevo (elige cualquier nombre y contraseña de base de datos).
3. En el menú izquierdo, ve a **SQL Editor** → **New query**.
4. Abre el archivo `supabase-setup.sql` de esta carpeta, copia todo su
   contenido, pégalo ahí y dale **Run**.
5. Ve a **Settings → API**. Copia dos valores:
   - **Project URL**
   - **anon public key**

## 2. Configura tus variables

1. Dentro de esta carpeta, copia el archivo `.env.example` y renómbralo a `.env`.
2. Pega ahí el Project URL y la anon key que copiaste, y elige una
   contraseña propia para `VITE_APP_PASSWORD` (esa será la contraseña para
   entrar al CRM).

## 3. Sube el proyecto a Vercel (hosting gratis)

1. Sube esta carpeta a un repositorio de GitHub (o usa `vercel` desde la
   terminal si prefieres línea de comandos: `npm i -g vercel` y luego `vercel`).
2. Entra a https://vercel.com, inicia sesión con GitHub, y da **Add New → Project**.
3. Selecciona el repositorio.
4. Antes de darle Deploy, abre **Environment Variables** y agrega las tres
   variables que pusiste en tu `.env` (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `VITE_APP_PASSWORD`).
5. Dale **Deploy**. En un minuto te da una URL como
   `https://crm-diamante-slowpitch.vercel.app`.

## 4. Pega esto en tu página de WordPress

En el editor de WordPress, agrega un bloque **HTML personalizado** en la
página donde quieras el CRM, y pega (cambiando la URL por la tuya de Vercel):

```html
<iframe
  src="https://TU-PROYECTO.vercel.app"
  width="100%"
  height="900"
  style="border:none;"
  title="CRM Slowpitch"
></iframe>
```

## 5. Protege esa página

El CRM tiene su propia contraseña (la que pusiste en `VITE_APP_PASSWORD`),
pero como capa extra, en WordPress ve a esa página → **Visibilidad → Protegida
con contraseña**, para que no aparezca en buscadores ni la vea cualquiera con
el link.

## Nota de seguridad

La contraseña del CRM es una barrera del lado del navegador, útil para uso
interno de tu equipo, pero no es un sistema de autenticación con cuentas
individuales. Si en el futuro necesitas que cada subdelegado tenga su propio
usuario y permisos distintos, ese sería el siguiente paso a construir
(Supabase lo soporta de forma nativa).

## Desarrollo local (opcional)

```bash
npm install
npm run dev
```
