import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "@firebase/firestore",
    "google-gax",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "google-auth-library",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_R2_PUBLIC_URL
          ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
          : "r2.dev",
        pathname: "/productos/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: process.env.NODE_ENV === "production" ? "same-origin-allow-popups" : "unsafe-none" },
        ],
      },
    ];
  },
};

export default nextConfig;
