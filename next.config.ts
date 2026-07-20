import type { NextConfig } from "next";
import { securityHeaders } from "./src/infrastructure/security-headers";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
