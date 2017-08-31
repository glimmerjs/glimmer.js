# Glimmer.js

Welcome to Glimmer.js! Glimmer.js is actually a made up of lots of small
packages, so this meta-repo exists to help you find what you're looking for.

## Resources

* [Guides](https://glimmerjs.com/guides)
* [API Docs](https://glimmerjs.com/api/)
* [Glimmer Playground](https://glimmer-playground.netlify.com)

## Packages

Glimmer.js is the developer-facing API on top of the low-level [Glimmer VM](https://github.com/glimmerjs/glimmer-vm).

### User-Facing

These packages are imported and used by Glimmer developers directly.

* [`@glimmer/application`] - user-friendly wrapper around the Glimmer VM environment
* [`@glimmer/component`] - defines the Glimmer component base class and component lifecycle
* [`@glimmer/web-component`] - addon for mounting Glimmer components as Web Components
* [`@glimmer/application-test-helpers`] - helpers for testing Glimmer components

[`@glimmer/application`]: https://github.com/glimmerjs/glimmer.js/tree/master/packages/%40glimmer/application
[`@glimmer/component`]: https://github.com/glimmerjs/glimmer.js/tree/master/packages/%40glimmer/component
[`@glimmer/web-component`]: https://github.com/glimmerjs/glimmer-web-component
[`@glimmer/application-test-helpers`]: https://github.com/glimmerjs/glimmer.js/tree/master/packages/%40glimmer/application-test-helpers

### Internals

These packages are used internally by Glimmer but may be useful for more advanced users.

* [`@glimmer/di`] - lightweight dependency injection library used by `@glimmer/application`
* [`@glimmer/resolver`] - resolver used by `@glimmer/application` to look up component modules

[`@glimmer/di`]: https://github.com/glimmerjs/glimmer-di
[`@glimmer/resolver`]: https://github.com/glimmerjs/glimmer-resolver

### Build Tooling

These packages are used for building Glimmer apps, and aren't intended to run in
the user's browser.

* [`@glimmer/application-pipeline`] - Broccoli-based build pipeline for Glimmer apps
* [`@glimmer/resolution-map-builder`] - utilities for building the resolution map used by `@glimmer-resolver`

[`@glimmer/application-pipeline`]: https://github.com/glimmerjs/glimmer-application-pipeline
[`@glimmer/resolution-map-builder`]: https://github.com/glimmerjs/resolution-map-builder
