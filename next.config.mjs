/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {
                protocol:"https",
                hostname:"randomuser.me",
            },
        ],
    },
    // setting the file limit size as 5mb for server actions
    experimental:{
        serverActions:{
            bodySizeLimit:"5mb",
        },
    },
};

export default nextConfig;
