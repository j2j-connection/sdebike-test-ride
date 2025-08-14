import type { NextConfig } from "next";

const securityHeaders = [
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
	{ key: 'X-XSS-Protection', value: '0' }
]

const nextConfig: NextConfig = {
	headers: async () => [
		{
			source: '/(.*)',
			headers: securityHeaders,
		},
	],
	telemetry: false,
};

export default nextConfig;
