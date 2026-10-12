import { AppShell } from "@/components/app/shell";
import { cerrarSesion } from "@/app/auth/actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell cerrarSesion={cerrarSesion}>{children}</AppShell>;
}
