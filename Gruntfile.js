module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typescript: {
            options: {
                module: 'commonjs',
                target: 'es5'
            },
            compile: {
                src: 'src/**/*.ts',
                dest: 'js/'
            }
        },
        clean: ['js'],
        watch: {
            typescript: {
                files: 'src/**/*.ts',
                tasks: ['typescript:compile']
            },
            config: {
                files: ["Gruntfile.js"]
            }
        }
    });

    grunt.loadNpmTasks('grunt-typescript-compile');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['typescript:compile']);
};