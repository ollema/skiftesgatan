const autoprefixer = require('autoprefixer');
const customMedia = require('postcss-custom-media');
const OpenProps = require('open-props');
const nesting = require('postcss-nesting');
const postcssJitProps = require('postcss-jit-props');

const config = {
	plugins: [autoprefixer, customMedia, nesting, postcssJitProps(OpenProps)]
};

module.exports = config;
