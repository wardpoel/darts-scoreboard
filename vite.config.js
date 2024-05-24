export default {
	root: 'source/frontend',
	publicDir: '../public',
	server: {
		proxy: {
			'/api': 'http://localhost:5000/',
			'/ws': 'ws://localhost:5000/',
		},
	},
	build: {
		emptyOutDir: true,
		outDir: '../build',
	},
};
