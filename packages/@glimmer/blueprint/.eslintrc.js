module.exports = {
  overrides: [
    // node files
    {
      files: [
        'index.js',
        'blueprints/**/*.js',
      ],
      env: {
        es6: true,
        node: true,
      },
    },
  ],
};
