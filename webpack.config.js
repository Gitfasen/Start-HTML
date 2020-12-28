const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	mode: process.env.NODE_ENV,
	output: {
		filename: 'core.min.js',
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /(node_modules)/,
				loader: 'babel-loader',
				query: {
					presets: [
						['@babel/preset-env',
							{
								debug: false,
								corejs: 3,
								useBuiltIns: "usage",
								targets: [
									'last 2 versions', 'not dead', '> 0.2%',
								]

							}
						]
					],
					plugins: [
						'@babel/plugin-proposal-class-properties'
					]
				},
			},
		],
	}
};
