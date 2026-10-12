"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LogOut, Menu, Plus, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BotonDiscreto } from "./discreto";
import { BotonTema } from "./tema";
import { Buscador } from "./buscador";
import { NAV_MOVIL, NAV_PRINCIPAL, NAV_SECUNDARIA, TODAS, esActivo, type ItemNav } from "./navegacion";

export function AppShell({
  children,
  cerrarSesion,
}: {
  children: React.ReactNode;
  cerrarSesion: () => Promise<void>;
}) {
  const pathname = usePathname();
  const actual = TODAS.find((n) => esActivo(pathname, n.href));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <Buscador cerrarSesion={cerrarSesion} />

      {/* Barra lateral (escritorio) */}
      <aside className="bg-surface sticky top-0 hidden h-dvh flex-col border-r lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <Logo />
          <span className="font-semibold tracking-tight">Mis Finanzas</span>
        </div>
        <div className="px-3">
          <button
            onClick={() => window.dispatchEvent(new Event("abrir-buscador"))}
            className="bg-background text-muted-foreground hover:text-foreground flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
          >
            <Search className="size-4" />
            Buscar…
            <kbd className="bg-muted ml-auto rounded px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ListaNav items={NAV_PRINCIPAL} pathname={pathname} />
          <p className="text-muted-foreground mt-6 mb-1 px-3 text-xs font-medium">Más</p>
          <ListaNav items={NAV_SECUNDARIA} pathname={pathname} />
        </nav>
        <div className="flex items-center gap-1 border-t p-3">
          <Button variant="ghost" size="sm" asChild className="mr-auto">
            <Link href="/cuenta">
              <KeyRound />
              Mi cuenta
            </Link>
          </Button>
          <BotonDiscreto />
          <BotonTema />
          <form action={cerrarSesion}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut />
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Barra superior (móvil) */}
        <header className="bg-background/85 sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center gap-1 px-3">
            <Link href="/" className="flex items-center gap-2 px-1">
              <Logo />
              <span key={actual?.href ?? "inicio"} className="animate-deslizar font-semibold tracking-tight">
                {actual?.titulo ?? "Mis Finanzas"}
              </span>
            </Link>
            <div className="ml-auto flex items-center">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Buscar"
                onClick={() => window.dispatchEvent(new Event("abrir-buscador"))}
              >
                <Search />
              </Button>
              <BotonDiscreto />
              <BotonTema />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8">
          <div key={pathname} className="animate-entrada">
            {children}
          </div>
        </main>

        {/* Barra inferior (móvil) */}
        <nav className="bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
            {NAV_MOVIL.izquierda.map((n) => (
              <TabMovil key={n.href} item={n} activo={esActivo(pathname, n.href)} />
            ))}
            <div className="flex justify-center">
              <Link
                href="/movimientos/nuevo"
                aria-label="Registrar movimiento"
                className="bg-primary text-primary-foreground shadow-primary/30 relative flex size-13 -translate-y-3 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
              >
                <span className="bg-primary/40 absolute inset-0 -z-10 animate-ping rounded-full [animation-duration:2.8s]" />
                <Plus className="size-6" strokeWidth={2.5} />
              </Link>
            </div>
            {NAV_MOVIL.derecha.map((n) => (
              <TabMovil key={n.href} item={n} activo={esActivo(pathname, n.href)} />
            ))}
            <MenuMas pathname={pathname} cerrarSesion={cerrarSesion} />
          </div>
        </nav>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
      <Wallet className="size-4" />
    </span>
  );
}

function ListaNav({ items, pathname }: { items: ItemNav[]; pathname: string }) {
  return (
    <ul className="grid gap-0.5">
      {items.map((n) => {
        const activo = esActivo(pathname, n.href);
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:bg-accent hover:text-foreground flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                activo && "bg-card text-foreground shadow-xs ring-1 ring-border",
              )}
            >
              <n.icono className={cn("size-4", activo && "text-primary")} />
              {n.titulo}
              {n.href === "/lemon" && <span className="bg-lemon ml-auto size-2 rounded-full" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function TabMovil({ item, activo }: { item: ItemNav; activo: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 text-[11px] font-medium",
        activo ? "text-primary" : "text-muted-foreground",
      )}
    >
      <item.icono className="size-5" strokeWidth={activo ? 2.4 : 2} />
      {item.titulo}
    </Link>
  );
}

function MenuMas({ pathname, cerrarSesion }: { pathname: string; cerrarSesion: () => Promise<void> }) {
  const items = [...NAV_PRINCIPAL.slice(2, 4), ...NAV_SECUNDARIA];
  const activo = items.some((n) => esActivo(pathname, n.href));
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "flex flex-col items-center gap-1 text-[11px] font-medium",
          activo ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Menu className="size-5" />
        Más
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Más</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-2 px-4">
          {items.map((n) => (
            <SheetClose asChild key={n.href}>
              <Link
                href={n.href}
                className={cn(
                  "bg-surface flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-center text-xs font-medium",
                  esActivo(pathname, n.href) && "ring-primary ring-2",
                )}
              >
                <n.icono className="text-primary size-5" />
                {n.titulo}
              </Link>
            </SheetClose>
          ))}
        </div>
        <div className="flex gap-2 px-4">
          <SheetClose asChild>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/cuenta">
                <KeyRound />
                Mi cuenta
              </Link>
            </Button>
          </SheetClose>
          <form action={cerrarSesion} className="flex-1">
            <Button variant="outline" type="submit" className="w-full">
              <LogOut />
              Salir
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
