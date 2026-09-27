import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pitch Therapy — Listening Studio",
    short_name: "Pitch Therapy",
    description:
      "Build a sharper musical ear through focused drills for pitch, intervals, frequency, and memory.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
