import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "mesero";

type CreateUserBody = {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Role;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: "Faltan variables de entorno de Supabase." }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return jsonResponse({ error: "No autorizado." }, 401);

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ error: "Sesion invalida." }, 401);

  const { data: callerProfile, error: callerError } = await supabaseAdmin
    .from("profiles")
    .select("rol, activo")
    .eq("id", userData.user.id)
    .single();

  if (callerError || !callerProfile) return jsonResponse({ error: "Perfil no encontrado." }, 403);
  if (callerProfile.rol !== "admin" || callerProfile.activo !== true) {
    return jsonResponse({ error: "Solo un administrador activo puede crear usuarios." }, 403);
  }

  let body: CreateUserBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body JSON invalido." }, 400);
  }

  const nombre = body.nombre?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const rol = body.rol;

  if (!nombre || !email || !password || !rol) {
    return jsonResponse({ error: "nombre, email, password y rol son obligatorios." }, 400);
  }
  if (!["admin", "mesero"].includes(rol)) {
    return jsonResponse({ error: "Rol invalido." }, 400);
  }
  if (password.length < 6) {
    return jsonResponse({ error: "La contrasena debe tener al menos 6 caracteres." }, 400);
  }

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
    app_metadata: { rol },
  });

  if (createError || !createdUser.user) {
    return jsonResponse({ error: createError?.message ?? "No se pudo crear el usuario." }, 400);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: createdUser.user.id,
      nombre,
      email,
      rol,
      activo: true,
    })
    .select("id, nombre, email, rol, activo, created_at")
    .single();

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return jsonResponse({ error: profileError.message }, 400);
  }

  return jsonResponse({ profile }, 201);
});
