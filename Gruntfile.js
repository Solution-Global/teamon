module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
          all: ['Gruntfile.js', 'script/*.js']
        },
      });

      grunt.loadNpmTasks('grunt-contrib-jshint');

      grunt.registerTask('default', ['jshint:all']);
    };
