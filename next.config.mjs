/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Autorise les Server Actions (formulaire de connexion, création de lot...).
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
