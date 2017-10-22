# Changelog

## v0.8.0 (2017-10-22)

We've got some big changes in v0.8.0 of Glimmer.js! The most notable change is
that we have migrated from dasherized components (`x-profile`) to capitalized
components (`Profile`). Multi-word components should be capitalized too, so
`user-profile` becomes `UserProfile`.

To upgrade existing Glimmer.js applications to 0.8.0, perform the following steps:

1. Modify your application's `package.json`:
  1. `@glimmer/application` should be `^0.8.0`.
  2. `@glimmer/component` should be `^0.8.0` (you may need to add this
     dependency).
2. Rename component files from dasherized to `CapitalCase`. For example, the
     `src/ui/components/user-profile` directory should be renamed to
     `src/ui/components/UserProfile`.
3. Change all component invocations from dasherized to `CapitalCase`. For
   example, change `<user-profile @user={{user}} />` to
   `<UserProfile @user={{user}} />`.

These are all of the changes that should be necessary to migrate an existing
app. For more information on this and other changes in Glimmer.js, make sure to
read the [Glimmer.js Progress
Report](https://emberjs.com/blog/2017/10/10/glimmer-progress-report.html) blog
post.

Note that 0.8.0 lays the foundation for compiling to binary bytecode, but does
not yet enable it. Expect this functionality to be enabled in a future release,
now that the requisite version of the underlying Glimmer compiler and VM have
been upgraded.

#### :bug: Bug Fix
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`
  * [#26](https://github.com/glimmerjs/glimmer.js/pull/26) Fix incompatibility with {{each}} and frozen objects. ([@tomdale](https://github.com/tomdale))

#### :house: Internal
* Other
  * [#32](https://github.com/glimmerjs/glimmer.js/pull/32) Update "lerna-changelog" to v0.7.0. ([@Turbo87](https://github.com/Turbo87))
  * [#27](https://github.com/glimmerjs/glimmer.js/pull/27) Add Changelog. ([@Turbo87](https://github.com/Turbo87))
* `@glimmer/application`, `@glimmer/component`
  * [#30](https://github.com/glimmerjs/glimmer.js/pull/30) Support running tests in the browser, Node, or both. ([@tomdale](https://github.com/tomdale))
* `@glimmer/application`, `@glimmer/component`, `@glimmer/local-debug-flags`
  * [#29](https://github.com/glimmerjs/glimmer.js/pull/29) Run tests in production and development modes. ([@tomdale](https://github.com/tomdale))

#### Committers: 2
- Tobias Bieniek ([Turbo87](https://github.com/Turbo87))
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.1 (2017-10-17)

#### :rocket: Enhancement
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`
  * [#13](https://github.com/glimmerjs/glimmer.js/pull/13) Update glimmer-vm to 0.29.0. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`, `@glimmer/test-utils`
  * [#10](https://github.com/glimmerjs/glimmer.js/pull/10) Compatibility with Glimmer VM 0.28. ([@tomdale](https://github.com/tomdale))

#### :memo: Documentation
* [#2](https://github.com/glimmerjs/glimmer.js/pull/2) Add Glimmer VM link. ([@MaXFalstein](https://github.com/MaXFalstein))
* [#1](https://github.com/glimmerjs/glimmer.js/pull/1) Add description of subpackages to README. ([@tomdale](https://github.com/tomdale))

#### :house: Internal
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`, `@glimmer/test-utils`
  * [#24](https://github.com/glimmerjs/glimmer.js/pull/24) Use Rollup to build test suite. ([@tomdale](https://github.com/tomdale))
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`, `@glimmer/local-debug-flags`, `@glimmer/test-utils`
  * [#3](https://github.com/glimmerjs/glimmer.js/pull/3) [Monorepo] Adopt @glimmer/component and @glimmer/application. ([@tomdale](https://github.com/tomdale))

#### Committers: 3
- Chad Hietala ([chadhietala](https://github.com/chadhietala))
- MaX Falstein ([MaXFalstein](https://github.com/MaXFalstein))
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.10 (2017-10-17)

#### :house: Internal
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`, `@glimmer/test-utils`
  * [#24](https://github.com/glimmerjs/glimmer.js/pull/24) Use Rollup to build test suite. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.9 (2017-10-12)

#### :bug: Bug Fix
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`, `@glimmer/test-utils`
  * [#23](https://github.com/glimmerjs/glimmer.js/pull/23) Fix dependencies and add failing tests for block params and user helpers. ([@chadhietala](https://github.com/chadhietala))

#### :house: Internal
* [#15](https://github.com/glimmerjs/glimmer.js/pull/15) Use yarn to install package dependencies. ([@tomdale](https://github.com/tomdale))

#### Committers: 2
- Chad Hietala ([chadhietala](https://github.com/chadhietala))
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.8 (2017-10-06)

#### :bug: Bug Fix
* [#21](https://github.com/glimmerjs/glimmer.js/pull/21) Bump @glimmer/compiler dependency to 0.29.3. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.7 (2017-09-29)

#### :rocket: Enhancement
* `@glimmer/application`
  * [#20](https://github.com/glimmerjs/glimmer.js/pull/20) Fix assertion error message. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.6 (2017-09-28)

#### :rocket: Enhancement
* `@glimmer/component`
  * [#19](https://github.com/glimmerjs/glimmer.js/pull/19) Implement component `bounds` feature. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.5 (2017-09-26)

#### :bug: Bug Fix
* `@glimmer/application`
  * [#17](https://github.com/glimmerjs/glimmer.js/pull/17) Fix issue with identifyComponent. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.8.0-alpha.2 (2017-09-26)

#### :bug: Bug Fix
* `@glimmer/component`
  * [#16](https://github.com/glimmerjs/glimmer.js/pull/16) Break RuntimeResolver circular dependency. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))
