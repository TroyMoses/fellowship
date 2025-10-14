/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "drive.google.com",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = {
        ...config.externals,
        aws4: "commonjs aws4",
        "gcp-metadata": "commonjs gcp-metadata",
        kerberos: "commonjs kerberos",
        snappy: "commonjs snappy",
        socks: "commonjs socks",
        "@aws-sdk/credential-providers":
          "commonjs @aws-sdk/credential-providers",
        "@mongodb-js/zstd": "commonjs @mongodb-js/zstd",
        "mongodb-client-encryption": "commonjs mongodb-client-encryption",
      };
    }
    return config;
  },
};

export default nextConfig;
