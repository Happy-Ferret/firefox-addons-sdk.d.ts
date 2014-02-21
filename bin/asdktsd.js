var child_process = require('child_process');

child_process.fork('../js/main.js', {
    cwd: __dirname,
    env: {
        NODE_PATH: '../lib'
    }
});