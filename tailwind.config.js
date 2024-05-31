let gridPlacementPlugin = require('tailwindcss-grid-placement');

module.exports = {
	content: ['./source/frontend/**/*'],
	theme: {
		extend: {},
	},
	plugins: [gridPlacementPlugin],
};
