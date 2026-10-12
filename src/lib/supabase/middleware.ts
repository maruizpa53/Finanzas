import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const RUTAS_PUBLICAS = ["/login"];
// Vistas previas de diseño con datos de ejemplo: solo en desarrollo.
const RUTAS_DESARROLLO = process.env.NODE_ENV === "production" ? [] : ["/preview"];

// Feed de calendario: se protege con su propio token secreto, no con la sesión.
const RUTAS_CON_TOKEN = ["/cal/"];

export async function updateSession(request: NextRequest) {
  if (RUTAS_CON_TOKEN.some((r) => request.nextUrl.pathname.startsWith(r))) {
    return NextResponse.next({ request });
  }
  if (RUTAS_DESARROLLO.some((r) => request.nextUrl.pathname.startsWith(r))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser valida el token contra Supabase Auth (no confiar solo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((r) => path === r || path.startsWith(`${r}/`));

  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
