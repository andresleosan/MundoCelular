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
};

export default nextConfig;
