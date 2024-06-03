let gridPlacementPlugin = require('tailwindcss-grid-placement');

module.exports = {
	content: ['./source/frontend/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [gridPlacementPlugin],
};
