/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase Realtime の WebSocket 接続をサポート
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
