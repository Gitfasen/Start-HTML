const prod          = process.env.NODE_ENV == 'production'
const gulp          = require('gulp')
const	server        = require('browser-sync').create()
const	rename_file   = require('gulp-rename')
const	del           = require('del')
const	sass          = require('gulp-sass')
const	cleancss      = require('gulp-clean-css')
const	sassGlob      = require('gulp-sass-glob')
const	group_media   = require('gulp-group-css-media-queries')
const	autoprefixer  = require('gulp-autoprefixer')
const	sourcemaps		= require('gulp-sourcemaps')
const	pug           = require('gulp-pug')
const	data          = require('gulp-data')
const imagemin      = require('gulp-image')
const	fs            = require('fs')
const	path          = require('path')
const	merge         = require('gulp-merge-json')
const	strip         = require('gulp-strip-comments')
const	gulpif        = require('gulp-if')
const	webpack       = require('webpack')
const	webpackStream = require('webpack-stream')
const	webpackConfig = require('./webpack.config.js')

function styles() {
	return gulp.src( './src/scss/main.scss')
	.pipe(gulpif(!prod, sourcemaps.init()))
	.pipe(sassGlob())
	.pipe(sass({
		outputeStyle: "expanded"
	}))
	.pipe(group_media())
	.pipe(rename_file({ suffix: '.min', prefix : '' }))
	.pipe(gulpif(prod, autoprefixer(['cover 99.5%'])))
	.pipe(gulpif(prod, cleancss()))
	.pipe(gulpif(!prod, sourcemaps.write()))
	.pipe(gulp.dest( 'dist/css/' ))
	.pipe(server.stream())
}

function scripts() {
	return gulp.src('./src/js/app.js')
	.pipe(webpackStream(webpackConfig), webpack)
	.pipe(gulpif(prod, strip()))
	.pipe(gulp.dest('./dist/js'))
	.pipe(server.stream())
}

function html_data() {
	return gulp.src('./src/data/**/*.json')
	.pipe(merge({
			fileName: 'data.json',
			edit: (json, file) => {
					const filename = path.basename(file.path),
								primaryKey = filename.replace(path.extname(filename), '');
					const data = {};
					data[primaryKey.toUpperCase()] = json;

					return data;
			}
	}))
	.pipe(gulp.dest('./src/temp'))
	.pipe(server.stream())
}

function html(){
	return gulp.src('./src/views/*.pug')
	.pipe(data(function() {
		return JSON.parse(fs.readFileSync('./src/temp/data.json'))
	}))
	.pipe(pug({
			pretty: true,
			basedir: './'
	}))
	.pipe(gulp.dest('./dist/'))
	.pipe(server.stream())
}

function fonts() {
	return gulp.src('src/fonts/**/*')
	.pipe(gulp.dest('dist/fonts'));
}

function images() {
	return gulp.src('src/img/**/*')
	.pipe(imagemin({
		optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
		pngquant: ['--speed=1', '--force', 256],
		zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
		jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
		mozjpeg: ['-optimize', '-progressive'],
		gifsicle: ['--optimize'],
		svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
	}))
	.pipe(gulp.dest('dist/img'));
}

function clean() {
	return del('dist/')
}

function watchFile() {
	gulp.watch(['./src/scss/**/*.scss'], styles);
	gulp.watch(['./src/js/**/*.js'], scripts);
	gulp.watch(['./src/views/**/*.pug'], html);
	gulp.watch(['./src/data/**/*.json'], gulp.series(html_data, html));
};

function browserSync() {
	server.init({
		server: "./dist",
		notify: false,
		open: false,
		cors: true,
		ui: false
	})
}

exports.default = gulp.series(
	clean, 
	html_data,
	fonts, 
	images,
	gulp.parallel(html, styles, scripts), 
	gulp.parallel(watchFile, browserSync)
);

exports.build = gulp.series(
	clean, 
	html_data, 
	fonts, 
	images,
	gulp.parallel(html, styles, scripts)
);

exports.build_prod = gulp.series(
	clean, 
	gulp.parallel(styles, scripts)
);
