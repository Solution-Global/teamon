module.exports = function(grunt) {
  grunt.initConfig({
    clean: {
      default: ["script/bundle.js"],
      browser_only_test: ["script/bundle.js", "tool/script/*.js"],
    },
    browserify: {
      'tool/script/bundle.js': ['node_modules/jquery/dist/jquery.js', 'node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js', 'node_modules/mustache/mustache.js', 'script/**/*.js']
    },
    concat: {
      default: {
        src: ['script/**/*.js'],
        dest: 'script/bundle.js',
      },
    },
    watch: {
      default: {
        files: ['script/**/*.js'],
        tasks: ['concat'],
      },
      browser_only_test: {
        files: ['script/**/*.js'],
        tasks: ['broswerify', 'copy'],
      },
    },
    copy: {
      browser_only_test: {
        src: 'tool/script/bundle.js',
        dest: 'script/bundle.js',
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['clean:default', 'concat:default', 'watch:default']);
  grunt.registerTask('browser_only_test', ['clean', 'browserify', 'copy:browser_only_test', 'watch:browser_only_test']);
};
