'use strict';

let isCI = !!process.env.CI;

let config = {
  "framework": "qunit",
  "test_page": "tests/index.html?hidepassed",
  "disable_watching": true,
  "browser_args": {
    "Chrome": [
      "--headless",
      "--disable-gpu",
      "--remote-debugging-port=9222"
    ]
  },
  "launch_in_ci": [
    "Chrome",
    "Firefox"
  ]
};

if (isCI) {
  config.tap_quiet_logs = true;
}

module.exports = config;
