import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Turbopack's CSS @import resolver fails when the parent directory has a space
  // ("video project"). Using --webpack flag in dev to avoid this.
  // turbopack config kept here for future reference / production builds.
};

export default nextConfig;
