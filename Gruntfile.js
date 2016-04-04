module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'script/*.js', 'script/rest/*.js', '*.js'],
      ignore: ['web/server.js']
    },
    browserify: {
      js: {
        // A single entry point for our app
        src: 'teamon.js',
        // Compile to a single file to add a script tag for in your HTML
        dest: 'web/teamon_bundle.js',
      },
      options: {
        watch : true
      }
    },
    watch: {
      scripts: {
        files: ['teamon.js'],
        tasks: ['browserify'],
        options: {
          spawn: false,
        },
      },
    },
    'create-windows-installer': {
      x64: {
        appDirectory: 'dist/win/teamon-win32-x64',
        outputDirectory: 'dist/win/installer64',
        exe: 'teamon.exe',
        iconUrl: 'http://211.253.26.248:8010/updates/releases/teamon.ico',
        setupIcon: './assets/win/teamon.ico',
        noMsi: true,
        authors: "UANGEL",
        loadingGif: "./assets/win/teamon.gif"
      }
    }
    // copy: {
    //   all: {
    //     // This copies all the html and css into the dist/ folder
    //     expand: true,
    //     src: ['**/*.html', '**/*.css', 'script/lib/*.js', '!node_modules/**'],
    //     dest: 'dist/',
    //   },
    // },
  });

  // Load the npm installed tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-electron-installer');
  //grunt.loadNpmTasks('grunt-contrib-copy');

  // The default tasks to run when you type: grunt
  // grunt.registerTask('default', ['jshint:all','browserify', 'copy']);
  grunt.registerTask('default', ['jshint:all','browserify', 'watch']);
  grunt.registerTask('once', ['jshint:all','browserify']);
  grunt.registerTask('installer', ['create-windows-installer']);
};
