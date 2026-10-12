"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Moon, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TODAS } from "./navegacion";

/** Buscador global ⌘K / Ctrl+K: navegar y ejecutar acciones. */
export function Buscador({ cerrarSesion }: { cerrarSesion: () => Promise<void> }) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    }
    function onAbrir() {
      setAbierto(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("abrir-buscador", onAbrir);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("abrir-buscador", onAbrir);
    };
  }, []);

  function ir(href: string) {
    setAbierto(false);
    router.push(href);
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={setAbierto}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border shadow-2xl">
          <Dialog.Title className="sr-only">Buscar</Dialog.Title>
          <Command loop className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
            <div className="flex items-center gap-2 border-b px-4">
              <Search className="text-muted-foreground size-4" />
              <Command.Input
                autoFocus
                placeholder="Buscar pantalla o acción…"
                className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-base outline-none"
              />
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="text-muted-foreground py-8 text-center text-sm">Sin resultados.</Command.Empty>
              <Command.Group heading="Acciones">
                <Item onSelect={() => ir("/movimientos/nuevo")} icono={<Plus />}>
                  Registrar movimiento
                </Item>
                <Item
                  onSelect={() => {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark");
                    setAbierto(false);
                  }}
                  icono={<Moon />}
                >
                  Cambiar tema claro / oscuro
                </Item>
                <Item onSelect={() => cerrarSesion()} icono={<LogOut />}>
                  Cerrar sesión
                </Item>
              </Command.Group>
              <Command.Group heading="Ir a">
                {TODAS.map((n) => (
                  <Item key={n.href} onSelect={() => ir(n.href)} icono={<n.icono />}>
                    {n.titulo}
                  </Item>
                ))}
                <Item onSelect={() => ir("/cuenta")} icono={<Search />}>
                  Mi cuenta y contraseña
                </Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Item({
  children,
  icono,
  onSelect,
}: {
  children: React.ReactNode;
  icono: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm [&_svg]:size-4 [&_svg]:opacity-70"
    >
      {icono}
      {children}
    </Command.Item>
  );
}
