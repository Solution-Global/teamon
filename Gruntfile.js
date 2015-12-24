module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
          dist: ["script/dist/bundle.js"],
          browser_only_test: ["script/dist/*.js", "tool/script/bundle.js"],
        },
        jshint: {
          beforeconcat: ['Gruntfile.js', 'script/*.js']
        },
        browserify: {
          'tool/script/bundle.js': ['script/*.js']
        },
        concat: {
          dist: {
            src: ['script/*.js'],
            dest: 'script/dist/bundle.js',
          },
        },
        copy: {
          browser_only_test: {
            src: 'tool/script/bundle.js',
            dest: 'script/dist/bundle.js',
          },
        },
        watch: {
          dist: {
            files: ['script/*.js'],
            tasks: ['concat:dist'],
          },
          browser_only_test: {
            files: ['script/*.js', 'script/module/*.js'],
            tasks: ['browserify', 'copy:browser_only_test'],
          },
        },
      });

      grunt.loadNpmTasks('grunt-contrib-clean');
      grunt.loadNpmTasks('grunt-contrib-copy');
      grunt.loadNpmTasks('grunt-browserify');
      grunt.loadNpmTasks('grunt-contrib-concat');
      grunt.loadNpmTasks('grunt-contrib-watch');
      grunt.loadNpmTasks('grunt-contrib-jshint');

      grunt.registerTask('default', ['clean:dist', 'jshint:beforeconcat', 'concat:dist', 'watch:dist']);
      grunt.registerTask('obsolete', ['clean:browser_only_test', 'browserify', 'copy:browser_only_test', 'watch:browser_only_test']);
    };
