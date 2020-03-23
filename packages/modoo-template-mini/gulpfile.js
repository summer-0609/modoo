const gulp = require('gulp');
const chalk = require('chalk');
const rename = require('gulp-rename');

const postcss = require('gulp-postcss');
const less = require('gulp-less');

// const { log } = console;

gulp.task('less', () => {
  return gulp
    .src('./src/**/*.less')
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

gulp.task('dev', gulp.series('less'));

// , () => {
//   log(chalk.green('build successfully...'));
//   log(chalk.cyan('开始监听文件...'));
// }
