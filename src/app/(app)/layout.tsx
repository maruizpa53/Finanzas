import Link from "next/link";
import { KeyRound, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cerrarSesion } from "@/app/auth/actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="bg-background/80 sticky top-0 z-10 border-b pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="text-primary size-5" />
            Mis Finanzas
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cuenta">
                <KeyRound />
                <span className="sr-only sm:not-sr-only">Mi cuenta</span>
              </Link>
            </Button>
            <form action={cerrarSesion}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
