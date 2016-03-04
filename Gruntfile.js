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
        dest: 'dist/script/teamon_bundle.js',
      },
    },
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
  //grunt.loadNpmTasks('grunt-contrib-copy');

  // The default tasks to run when you type: grunt
  // grunt.registerTask('default', ['jshint:all','browserify', 'copy']);
  grunt.registerTask('default', ['jshint:all','browserify']);
};
