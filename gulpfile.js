var syntax        = 'sass'; // Syntax: sass or scss;

var gulp          = require('gulp'),
		gutil         = require('gulp-util' ),
		sass          = require('gulp-sass'),
		browserSync   = require('browser-sync'),
		concat        = require('gulp-concat'),
		uglify        = require('gulp-uglify'),
		rename        = require('gulp-rename'),
		del           = require('del'),
		cleancss      = require('gulp-clean-css'),
		rename        = require('gulp-rename'),
		autoprefixer  = require('gulp-autoprefixer'),
		notify        = require("gulp-notify"),
		include       = require('gulp-html-tag-include'),
		bulkSass      = require('gulp-sass-bulk-import'),
		imagemin      = require('gulp-imagemin'),
		htmlmin       = require('gulp-htmlmin');

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		open: false,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
	})
});

gulp.task('html', function() {
    return gulp.src(['app/html/*.html'])
        .pipe(include())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('app'));
});


gulp.task('styles', function() {
	return gulp.src('app/'+syntax+'/*.'+syntax+'')
	.pipe(bulkSass())
	.pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
	.pipe(rename({ suffix: '.min', prefix : '' }))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.stream())
});

gulp.task('js', function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/libs/jQuery.mmenu/dist/jquery.mmenu.all.js',
		'app/libs/jQuery.mmenu/src/jquery.mmenu.debugger.js',
		'app/libs/magnific-popup/dist/jquery.magnific-popup.js',
		'app/libs/jquery.cookie/jquery.cookie.js',
		'app/libs/modal-video/js/jquery-modal-video.js',
		'app/libs/modal-video/js/modal-video.js',
		'app/libs/page-scroll-to-id/jquery.malihu.PageScroll2id.js',
		'app/js/common.js', // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	.pipe(uglify()) // Mifify js (opt.)
    .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({ stream: true }))
});



gulp.task('watch', ['html', 'styles', 'js', 'browser-sync'], function() {
    gulp.watch('app/html/**/*.html', ['html']);
	gulp.watch('app/'+syntax+'/**/*.'+syntax+'', ['styles']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/*.html', browserSync.reload)
});

gulp.task('imagemin', function() {
    return gulp.src('app/img/**/*')
    // .pipe(cache(imagemin())) // Cache Images
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['removedist', 'styles', 'js', 'html', 'imagemin'], function() {

    var buildFiles = gulp.src([
        'app/*.html',
        'app/.htaccess',
    ]).pipe(gulp.dest('dist'));

    var buildCss = gulp.src([
        'app/css/main.min.css',
    ]).pipe(gulp.dest('dist/css'));

    var buildJs = gulp.src([
        'app/js/scripts.min.js',
    ]).pipe(gulp.dest('dist/js'));

    var buildFonts = gulp.src([
        'app/fonts/**/*',
    ]).pipe(gulp.dest('dist/fonts'));

});
gulp.task('removedist', function() { return del.sync('dist'); });

gulp.task('default', ['watch']);
