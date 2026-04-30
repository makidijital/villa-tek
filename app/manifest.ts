import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalkan Üzümlü Balayı Villası | 1+1 Özel Havuzlu Kiralık Villa",
    short_name: "Villa",
    description: "Kaş Kalkan Üzümlü’de doğa içinde konumlanan 1+1 balayı villası. Korunaklı özel havuz, sakin konum ve romantik tatil için ideal. Hemen rezervasyon yapın.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
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