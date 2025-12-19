import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['src/index.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	sourcemap: true,
	outfile: 'build/index.js',
	packages: 'external',
	logLevel: 'info',
});
