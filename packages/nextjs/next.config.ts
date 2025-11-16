import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com https://wrpcd.net https://*.wrpcd.net https://privy.farcaster.xyz https://privy.warpcast.com https://auth.privy.io https://*.rpc.privy.systems https://cloudflareinsights.com https://explorer-api.walletconnect.com https://relay.walletconnect.com wss://relay.walletconnect.com https://rpc.walletconnect.com https://*.walletconnect.com https://forno.celo.org https://mainnet.base.org https://gateway.pinata.cloud https://*.mypinata.cloud wss://*.bridge.walletconnect.org https://eth.merkle.io https://*.alchemy.com https://*.g.alchemy.com https://api.neynar.com https://pulse.walletconnect.org https://api.web3modal.org https://*.coinbase.com https://fuse-rpc.gateway.pokt.network https://rpc.fuse.io https://*.infura.io https://*.publicnode.com",
              "frame-ancestors 'self' https://farcaster.xyz https://warpcast.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://farcaster.xyz",
          },
        ],
      },
    ];
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
}

module.exports = nextConfig;
