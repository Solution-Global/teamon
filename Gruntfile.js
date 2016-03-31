module.exports = function(grunt) {
    grunt.initConfig({
        'jshint': {
          all: ['Gruntfile.js', 'script/*.js']
        },
        'create-windows-installer': {
          x64: {
            appDirectory: './release/win/teamon-win32-x64',
            outputDirectory: './release/win/installer64',
            iconUrl: 'http://211.253.26.248:8010/updates/releases/teamon16x16.ico',
            setupIcon: './assets/win/teamon.ico',
            noMsi: true
          }
        }
      });

      grunt.loadNpmTasks('grunt-contrib-jshint');
      grunt.loadNpmTasks('grunt-electron-installer');

      grunt.registerTask('default', ['jshint:all']);
    };
