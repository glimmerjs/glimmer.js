'use strict';

const DEFAULT_BROWSER = 'Chrome';
const CI_BROWSER = process.env.CI_BROWSER || DEFAULT_BROWSER;

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: [CI_BROWSER],
  launch_in_dev: [DEFAULT_BROWSER],
  browser_start_timeout: 120,
  browser_args: {
    Firefox: {
      mode: 'ci',
      // https://github.com/SeleniumHQ/selenium/pull/6075
      args: ['-headless', '--width=1440', '--height=900'],
    },
    Chrome: {
      ci: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.CI ? '--no-sandbox' : null,
        '--headless',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900',
      ].filter(Boolean),
    },
  },
};
