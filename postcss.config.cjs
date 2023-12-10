const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const config = {
	plugins: [require('tailwindcss/nesting'), tailwindcss(), autoprefixer]
};

module.exports = config;
