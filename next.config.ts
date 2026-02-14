import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kgywacjnd3.ufs.sh",
      }
    ]
  }
};

export default nextConfig;
