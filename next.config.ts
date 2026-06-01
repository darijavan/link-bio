import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["leading-many-rhino.ngrok-free.app"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

export default nextConfig;
