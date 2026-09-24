/** @type {import('next').NextConfig} */
const nextConfig = {
	// Let Next.js's build trace through workspace packages that live outside
	// apps/web (packages/auth, packages/database, and — as of Chunk 7 —
	// everything Audio Studio's Server Actions call directly) — required in
	// a pnpm monorepo so `next build` bundles them correctly.
	transpilePackages: [
		'@platform/auth',
		'@platform/database',
		'@platform/ai-core',
		'@platform/credits',
		'@platform/queue',
		'@platform/storage',
		'@modules/audio'
	],
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb'
		},
		serverComponentsExternalPackages: ['@prisma/client']
	}
};

export default nextConfig;
