const gulp = require('gulp');
const chalk = require('chalk');
const rename = require('gulp-rename');

const ora = require('ora');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache'); // 使用缓存
const less = require('gulp-less');

const env = process.env.NODE_ENV;

const { log } = console;

gulp.task('less', () => {
  return gulp
    .src('./miniprogram/**/*.less')
    .pipe(less())
    .pipe(postcss())
    .pipe(
      rename((path) => {
        path.extname = '.wxss';
      })
    )
    .pipe(
      gulp.dest((file) => {
        return file.base; // 原目录
      })
    );
});

gulp.task('miniimage', () => {
  return gulp
    .src('./miniprogram/**/*.{png,jpe?g,gif,svg}')
    .pipe(
      cache(
        imagemin([
          // imagemin.gifsicle({ interlaced: true }), // 严重影响速度
          imagemin.mozjpeg({ quality: 75, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
          }),
        ])
      )
    )
    .pipe(
      gulp.dest((file) => {
        return file.base; // 原目录
      })
    );
});

gulp.task(
  'dev',
  gulp.series('less', (done) => {
    done();
    if (env === 'development') {
      log(' '.padEnd(2, '\n'));
      log(chalk.cyan('正在监听文件改动...'));
    }
  })
);

gulp.task(
  'build',
  gulp.series(gulp.parallel('less', 'miniimage'), (done) => {
    const spinner = ora(chalk.cyan('正在编译文件...')).start();
    done();
    log(' '.padEnd(2, '\n'));
    spinner.succeed(chalk.green('编译完成, 可以上传代码啦...'));
  })
);

if (env === 'development') {
  gulp.watch(['./miniprogram/**/*.less'], gulp.series('less')).on('change', (path) => {
    log(chalk.greenBright(`File ${path} was changed`));
  });
}
