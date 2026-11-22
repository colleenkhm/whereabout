import type { NextConfig } from "next";

// Static export: every country page prebuilt to HTML in out/.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
