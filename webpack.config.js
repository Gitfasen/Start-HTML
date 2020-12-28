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
						[
							'@babel/preset-env',
							{
								targets: [
									'last 2 versions', 'not dead', '> 0.2%',
								]
							}
						]
					]
				},
			},
		],
	}
};
