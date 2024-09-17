/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "kochwerk.konkaapps.de",
                pathname: "//KMSLiveRessources/speiseplangericht/**",
            },
            {
                protocol: "https",
                hostname: "kochwerk.konkaapps.de",
                pathname: "/KMSLiveRessources//speiseplangericht/**",
            },
        ],
    },
};

export default nextConfig;
