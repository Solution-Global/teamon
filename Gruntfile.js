module.exports = function(grunt) {
    grunt.initConfig({
        'jshint': {
          all: ['Gruntfile.js', 'script/*.js']
        },
        'electron-installer-windows': {
          win64: {
            src: './release/win/teamon-win32-x64',
            dest: './release/win/installer'
          }
        }
      });

      grunt.loadNpmTasks('grunt-contrib-jshint');
      grunt.loadNpmTasks('grunt-electron-installer-windows');

      grunt.registerTask('default', ['jshint:all']);
    };
