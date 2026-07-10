// Register tsconfig paths before loading the app
require('tsconfig-paths').register({
  baseUrl: __dirname,
  paths: {
    '@/*': ['*'],
    '@services/*': ['services/*'],
    '@middleware/*': ['middleware/*'],
    '@utils/*': ['utils/*'],
    '@types/*': ['types/*']
  }
});

module.exports = require('./index');
