"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function Avisos() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      toastOptions={{ className: "font-sans" }}
      offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Avisos />
    </ThemeProvider>
  );
}
