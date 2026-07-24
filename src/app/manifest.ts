import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voyage Log",
    short_name: "Voyage Log",
    description: "Gerenciamento de viagens e despesas",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8a5a3b", /
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}