const gulp = require('gulp');
const chalk = require('chalk');
const del = require('del');
const ora = require('ora');

const rename = require('gulp-rename');
const jsonminify = require('gulp-jsonminify2');

const less = require('gulp-less');
const postcss = require('gulp-postcss');
const purify = require('gulp-purifycss');
const htmlmin = require('gulp-htmlmin');

const env = process.env.NODE_ENV;
const { log } = console;

gulp.task('clean', () => {
  return del(['./dist/**']);
});

gulp.task('json', () => {
  return gulp.src('./src/**/*.json').pipe(jsonminify()).pipe(gulp.dest('./dist'));
});

gulp.task('assets', () => {
  return gulp.src('./src/assets/**').pipe(gulp.dest('./dist/assets'));
});

gulp.task('templtes', () => {
  return gulp
    .src('./src/**/*.wxml')
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true,
        keepClosingSlash: true,
      })
    )
    .pipe(gulp.dest('./dist'));
});

gulp.task('less', () => {
  return gulp
    .src('./src/**/*.less')
    .pipe(less())
    .pipe(postcss())
    .pipe(purify(['./src/**/*.wxml'], { minify: true }))
    .pipe(
      rename((path) => {
        path.extname = '.wxss';
      })
    )
    .pipe(gulp.dest('./dist'));
});

gulp.task('scripts', () => {
  return gulp.src('./src/**/*.js').pipe(gulp.dest('./dist'));
});

gulp.task('template', () => {
  return gulp
    .src('./src/**/*.wxml')
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true,
        keepClosingSlash: true,
      })
    )
    .pipe(gulp.dest('./dist'));
});

gulp.task(
  'build',
  gulp.series(gulp.parallel('less', 'json', 'assets', 'template', 'scripts'), (done) => {
    const spinner = ora(chalk.cyan('正在编译文件...')).start();
    done();
    log(' '.padEnd(2, '\n'));
    spinner.succeed(chalk.green('编译完成, 可以上传代码啦...'));
  })
);

gulp.task(
  'dev',
  gulp.series(['less', 'json', 'assets', 'template', 'scripts'], (done) => {
    done();
    if (env === 'development') {
      log(' '.padEnd(2, '\n'));
      log(chalk.cyan('正在监听文件改动...'));
    }
  })
);

if (env === 'development') {
  gulp
    .watch(
      ['./src/**/*.less', './src/**/*.json', './src/assets/**', './src/**/*.wxml', './src/**/*.js'],
      gulp.series('less', 'json', 'assets', 'template', 'scripts')
    )
    .on('change', (path) => {
      log(chalk.greenBright(`File ${path} was changed`));
    });
}
