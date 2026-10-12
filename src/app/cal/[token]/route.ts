import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hoyBogota } from "@/lib/format";
import { generarIcs, type FeedCalendario } from "@/lib/finance/ics";

// Feed público protegido por token (Google Calendar no puede iniciar sesión).
// Solo expone nombres, montos esperados y días de pago; nunca movimientos.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const limpio = token.replace(/\.ics$/, "");
  if (!/^[A-Za-z0-9_-]{32,}$/.test(limpio)) return new Response("No encontrado", { status: 404 });

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("calendario_feed", { p_token: limpio });
  if (error || !data) return new Response("No encontrado", { status: 404 });

  const ics = generarIcs(data as unknown as FeedCalendario, hoyBogota(), new URL(request.url).origin);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="pagos.ics"',
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
