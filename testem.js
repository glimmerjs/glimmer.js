'use strict';

let isCI = !!process.env.CI;

let config = {
  "framework": "qunit",
  "test_page": "tests/browser/index.html?hidepassed",
  "disable_watching": true,
  "launchers": {
    "Node": {
      "command": "bin/run-node-tests.js",
      "protocol": "tap"
     }
  },
  "browser_args": {
    "mode": "ci",
    "Chrome": [
      "--headless",
      "--disable-gpu",
      "--remote-debugging-port=9222"
    ]
  },
  "launch_in_dev": [
    "Chrome",
    "Node"
  ],
  "launch_in_ci": [
    "Chrome",
    "Firefox",
    "Node"
  ]
};

if (isCI) {
  config.tap_quiet_logs = true;
}

module.exports = config;
