import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mis Finanzas",
    short_name: "Finanzas",
    description: "Portal privado de finanzas personales",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f9fc",
    theme_color: "#3730a3",
    lang: "es-CO",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Registrar gasto", url: "/movimientos/nuevo", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Lemon", url: "/lemon", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
