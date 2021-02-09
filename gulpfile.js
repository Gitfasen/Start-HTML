const prod = process.env.NODE_ENV == 'production'
const gulp = require('gulp')
const gulpif = require('gulp-if')
const server = require('browser-sync').create()
const rename_file = require('gulp-rename')
const del = require('del')
const sass = require('gulp-sass')
const cleancss = require('gulp-clean-css')
const sassGlob = require('gulp-sass-glob')
const group_media = require('gulp-group-css-media-queries')
const autoprefixer = require('gulp-autoprefixer')
const sourcemaps = require('gulp-sourcemaps')
const pug = require('gulp-pug')
const data = require('gulp-data')
const merge = require('gulp-merge-json')
const imagemin = require('gulp-image')
const fs = require('fs')
const path = require('path')
const strip = require('gulp-strip-comments')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const webpackConfig = require('./webpack.config.js')

/* ========================= */
/* === Обработка стилей ==== */
/* ========================= */
function styles() {
	return gulp.src( './src/scss/main.scss')
		.pipe(gulpif(!prod, sourcemaps.init()))
		.pipe(sassGlob()) // автоимпорт всех файлов из папки компонентов
		.pipe(sass({
				outputeStyle: "expanded",
        includePaths: [
          'node_modules/bootstrap/scss/'
        ]
		}))
		.pipe(group_media())
		.pipe(rename_file({ suffix: '.min', prefix : '' }))
		.pipe(gulpif(prod, autoprefixer(['cover 99.5%'])))
		.pipe(gulpif(prod, cleancss()))
		.pipe(gulpif(!prod, sourcemaps.write()))
		.pipe(gulp.dest( 'dist/css/' ))
		.pipe(server.stream())
}

/* ========================= */
/* == Обработка скриптов === */
/* ========================= */
function scripts() {
	return gulp.src('./src/js/app.js')
		.pipe(webpackStream(webpackConfig), webpack) // пропускаем все черех вебпак
		.pipe(gulpif(prod, strip())) // удаляем коменты
		.pipe(gulp.dest('./dist/js'))
		.pipe(server.stream())
}

/* ========================= */
/* = Создание общего json == */
/* ========================= */
function html_data() {
	return gulp.src('./src/data/**/*.json')
		// мержим все файлы контента с папки data и берем название файла как ключ
		.pipe(merge({
						fileName: 'data.json',
						edit: (json, file) => {
										const filename = path.basename(file.path),
																primaryKey = filename.replace(path.extname(filename), '');
										const data = {};
										data[primaryKey.toUpperCase()] = json; // тут можно убрать капс для ключа

										return data;
						}
		}))
		.pipe(gulp.dest('./src/temp'))
		.pipe(server.stream())
}

/* ========================= */
/* Обработка html через pug  */
/* ========================= */
function html(){
	return gulp.src('./src/views/*.pug')
		.pipe(data(function() {
				return JSON.parse(fs.readFileSync('./src/temp/data.json')) // добавляем данные с json для всех файлов pug
		}))
		.pipe(pug({
						pretty: true,
						basedir: './src/views'
		}))
		.pipe(gulp.dest('./dist/'))
		.pipe(server.stream())
}

/* ========================= */
/* === Обработка шрифтов === */
/* ========================= */
function fonts() {
	return gulp.src('src/fonts/**/*')
		.pipe(gulp.dest('dist/fonts'));
}

/* ============================================= */
/* ========== Оптимизация картинок ============= */
/* brew install libjpeg libpng on macOS ======== */
/* apt-get install -y libjpeg libpng on Ubuntu = */
/* npm install -g windows-build-tools on Windows */
/* ============================================= */
function images() {
	return gulp.src('src/img/**/*')
		.pipe(gulp.dest('dist/img'));
}
function image_optimize() {
	return gulp.src('src/img/**/*')
		.pipe(gulpif(prod, imagemin({
				optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
				pngquant: ['--speed=1', '--force', 256],
				zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
				jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
				mozjpeg: ['-optimize', '-progressive'],
				gifsicle: ['--optimize'],
				svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
		})))
		.pipe(gulp.dest('dist/img'));
}

/* ========================= */
/* ===== Очистка папки ===== */
/* ========================= */
function clean() {
	return del('dist/')
}

/* =========================== */
/* Функции слежение за файлами */
/* =========================== */
function watchFile() {
	gulp.watch('./src/scss/**/*.scss', gulp.series(styles));
	gulp.watch('./src/js/**/*.js', gulp.series(scripts));
	gulp.watch('./src/views/**/*.pug', gulp.series(html));
	gulp.watch('./src/data/**/*.json', gulp.series(html_data, html));
}

/* =========================== */
/* ====== Запуск сервера ===== */
/* =========================== */
function browserSync() {
	server.init({
		server: "./dist",
		notify: false,
		open: false,
		cors: true,
		ui: false
	})
}

/* ================================== */
/* ==== Создание команд консоли ===== */
/* = запускать через скрипты ноды === */
/* ================================== */
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
	images, // или image_optimize
	gulp.parallel(html, styles, scripts)
)

exports.build_prod = gulp.parallel(styles, scripts)
