import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Posty AI",
    short_name: "Posty",
    description: "AI content studio for blogs, reviews, SNS, and product detail pages.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      { src: "/posty-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

