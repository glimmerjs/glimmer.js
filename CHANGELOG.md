# Changelog

## v0.9.1 (2018-02-15)

#### :house: Internal
* `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`
  * [#113](https://github.com/glimmerjs/glimmer.js/pull/113) Include handle in bytecode data segment metadata. ([@tomdale](https://github.com/tomdale))

#### Committers: 1
- Tom Dale ([tomdale](https://github.com/tomdale))

## v0.9.0 (2018-02-08)

Glimmer.js v0.9.0 is a big infrastructural upgrade that lays the groundwork for
some exciting new features.

The biggest change in 0.9.0 is that we've broken apart the monolithic `Application` class
into composable objects to change how Glimmer.js behaves:

1. A `Renderer` controls how Glimmer performs the initial render.
2. A `Loader` controls how Glimmer loads and compiles templates.
3. A `Builder` controls how DOM elements are constructed when templates are
   rendered.

One benefit of this design is that we can add different modes to Glimmer without
having to ship code for unused modes. For more discussion, see [#34: Separate
Application responsibilities](https://github.com/glimmerjs/glimmer.js/pull/34).

Out of the box, you can experiment with incremental rendering in your Glimmer.js
app using the new `AsyncRenderer`. This renderer breaks initial rendering into
small, discrete units of work. Each unit of work is scheduled using the
browser's [`requestIdleCallback`
API](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback),
ensuring the browser stays responsive even on slower devices and complex pages.

We will also be adding binary bytecode templates and server-side rendering with
rehydration in a future release. The implementation for these features are in
the 0.9.0 release, but not yet integrated into the default application produced
by the blueprint.

To upgrade existing Glimmer.js applications, you will need to update the `src/main.ts` file
to specify the renderer, loader and builder to use. To preserve the rendering behavior
of Glimmer.js 0.8.0, use the `DOMRenderer`, `RuntimeCompilerLoader`, and `SyncRenderer`:

```ts
// src/main.ts
import Application, { DOMBuilder, RuntimeCompilerLoader, SyncRenderer } from '@glimmer/application';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import moduleMap from '../config/module-map';
import resolverConfiguration from '../config/resolver-configuration';

export default class App extends Application {
  constructor() {
    let moduleRegistry = new BasicModuleRegistry(moduleMap);
    let resolver = new Resolver(resolverConfiguration, moduleRegistry);
    const element = document.body;

    super({
      builder: new DOMBuilder({ element, nextSibling: null }),
      loader: new RuntimeCompilerLoader(resolver),
      renderer: new SyncRenderer(),
      resolver,
      rootName: resolverConfiguration.app.rootName,
    });
  }
}
```

## v0.9.0-alpha.14 (2018-02-08)

#### :rocket: Enhancement
* `@glimmer/blueprint`
  * [#109](https://github.com/glimmerjs/glimmer.js/pull/109) Fix Yarn failure + other updates. ([@tomdale](https://github.com/tomdale))
* `@glimmer/application`
  * [#107](https://github.com/glimmerjs/glimmer.js/pull/107) Use non-volatile UpdatableReference from @glimmer/component. ([@tomdale](https://github.com/tomdale))
  * [#104](https://github.com/glimmerjs/glimmer.js/pull/104) Unify Loader Interface. ([@chadhietala](https://github.com/chadhietala))
  * [#97](https://github.com/glimmerjs/glimmer.js/pull/97) Don't use rAF for scheduling re-render. ([@chadhietala](https://github.com/chadhietala))

#### :memo: Documentation
* `@glimmer/application`
  * [#108](https://github.com/glimmerjs/glimmer.js/pull/108) Inline API docs for @glimmer/application. ([@tomdale](https://github.com/tomdale))
* `@glimmer/component`
  * [#53](https://github.com/glimmerjs/glimmer.js/pull/53) Update and improve Component documentation. ([@locks](https://github.com/locks))

#### :house: Internal
* `@glimmer/blueprint`
  * [#106](https://github.com/glimmerjs/glimmer.js/pull/106) add set -e to fail early. ([@kellyselden](https://github.com/kellyselden))
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`, `@glimmer/ssr`
  * [#105](https://github.com/glimmerjs/glimmer.js/pull/105) Bump glimmer-vm to 0.30.5. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/app-compiler`
  * [#93](https://github.com/glimmerjs/glimmer.js/pull/93) Implicit 'projectPath' for Broccoli Plugin. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 4
- Chad Hietala ([chadhietala](https://github.com/chadhietala))
- Kelly Selden ([kellyselden](https://github.com/kellyselden))
- Ricardo Mendes ([locks](https://github.com/locks))
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.9.0-alpha.13 (2017-12-09)

#### :rocket: Enhancement
* `@glimmer/application-test-helpers`, `@glimmer/application`
  * [#96](https://github.com/glimmerjs/glimmer.js/pull/96) Helpers should not be volatile. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/blueprint`
  * [#87](https://github.com/glimmerjs/glimmer.js/pull/87) Import `@glimmer/blueprint` into monorepo. ([@Turbo87](https://github.com/Turbo87))

#### :bug: Bug Fix
* `@glimmer/application`
  * [#95](https://github.com/glimmerjs/glimmer.js/pull/95) Use Glimmer.js version of UpdatableReference to avoid action volatility. ([@tomdale](https://github.com/tomdale))

#### Committers: 3
- Chad Hietala ([chadhietala](https://github.com/chadhietala))
- Tobias Bieniek ([Turbo87](https://github.com/Turbo87))
- Tom Dale ([tomdale](https://github.com/tomdale))


## v0.9.0-alpha.12 (2017-11-28)

#### :bug: Bug Fix
* `@glimmer/application`, `@glimmer/compiler-delegates`
  * [#91](https://github.com/glimmerjs/glimmer.js/pull/91) Confirm dynamic invocations work post-refactor. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.10 (2017-11-28)

#### :rocket: Enhancement
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`
  * [#89](https://github.com/glimmerjs/glimmer.js/pull/89) Refactor Data Segment. ([@chadhietala](https://github.com/chadhietala))

#### :house: Internal
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`, `@glimmer/ssr`
  * [#90](https://github.com/glimmerjs/glimmer.js/pull/90) Update @glimmer/vm packages. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/application-test-helpers`, `@glimmer/component`
  * [#85](https://github.com/glimmerjs/glimmer.js/pull/85) Remove unused/duplicate dev dependencies. ([@Turbo87](https://github.com/Turbo87))
* Other
  * [#80](https://github.com/glimmerjs/glimmer.js/pull/80) Remove unused `emberjs-build` dependency. ([@Turbo87](https://github.com/Turbo87))
  * [#83](https://github.com/glimmerjs/glimmer.js/pull/83) TravisCI improvements. ([@Turbo87](https://github.com/Turbo87))
  * [#84](https://github.com/glimmerjs/glimmer.js/pull/84) Update broccoli dependencies. ([@Turbo87](https://github.com/Turbo87))
* `@glimmer/app-compiler`
  * [#82](https://github.com/glimmerjs/glimmer.js/pull/82) app-compiler: Remove unnecessary `co` dependency. ([@Turbo87](https://github.com/Turbo87))
* `@glimmer/app-compiler`, `@glimmer/compiler-delegates`
  * [#81](https://github.com/glimmerjs/glimmer.js/pull/81) Replace deprecated `qunitjs` dependency with `qunit`. ([@Turbo87](https://github.com/Turbo87))

#### Committers: 2
- Chad Hietala ([chadhietala](https://github.com/chadhietala))
- Tobias Bieniek ([Turbo87](https://github.com/Turbo87))


## v0.9.0-alpha.9 (2017-11-16)

#### :rocket: Enhancement
* `@glimmer/application`
  * [#75](https://github.com/glimmerjs/glimmer.js/pull/75) Actually Expose The Rehydrating Builder. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.8 (2017-11-15)

#### :bug: Bug Fix
* `@glimmer/compiler-delegates`
  * [#74](https://github.com/glimmerjs/glimmer.js/pull/74) BUGFIX: Builtin helpers and app helpers serialization. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.7 (2017-11-15)

#### :house: Internal
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`
  * [#73](https://github.com/glimmerjs/glimmer.js/pull/73) Add End To End Smoke Test. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.6 (2017-11-13)

#### :bug: Bug Fix
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`
  * [#69](https://github.com/glimmerjs/glimmer.js/pull/69) Fix serialization. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.5 (2017-11-09)

#### :rocket: Enhancement
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`, `@glimmer/ssr`
  * [#66](https://github.com/glimmerjs/glimmer.js/pull/66) Improve bytecode compilation. ([@tomdale](https://github.com/tomdale))

#### :house: Internal
* `@glimmer/application`
  * [#65](https://github.com/glimmerjs/glimmer.js/pull/65) Remove dependency on @glimmer/test-helpers. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/compiler-delegates`
  * [#64](https://github.com/glimmerjs/glimmer.js/pull/64) Data Segment Generation Tests. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/app-compiler`, `@glimmer/compiler-delegates`
  * [#60](https://github.com/glimmerjs/glimmer.js/pull/60) Add more tests for 3rd party builtins. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 4
- Chad Hietala ([chadhietala](https://github.com/chadhietala))
- Tom Dale ([tomdale](https://github.com/tomdale))
- Toran Billups ([toranb](https://github.com/toranb))
- [OlmoDalco](https://github.com/OlmoDalco)


## v0.9.0-alpha.4 (2017-10-30)

#### :rocket: Enhancement
* `@glimmer/app-compiler`, `@glimmer/application`, `@glimmer/compiler-delegates`
  * [#59](https://github.com/glimmerjs/glimmer.js/pull/59) Allow for host to pass builtin names. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.3 (2017-10-30)

#### :house: Internal
* `@glimmer/application`
  * [#57](https://github.com/glimmerjs/glimmer.js/pull/57) Remove unused Component import. ([@chadhietala](https://github.com/chadhietala))
  * [#55](https://github.com/glimmerjs/glimmer.js/pull/55) Type Notifier. ([@chadhietala](https://github.com/chadhietala))

#### Committers: 1
- Chad Hietala ([chadhietala](https://github.com/chadhietala))


## v0.9.0-alpha.2 (2017-10-30)

#### :rocket: Enhancement
* `@glimmer/application`, `@glimmer/component`
  * [#51](https://github.com/glimmerjs/glimmer.js/pull/51) Optimize template-only components. ([@tomdale](https://github.com/tomdale))
  * [#47](https://github.com/glimmerjs/glimmer.js/pull/47) Adding guards to component manager. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`
  * [#50](https://github.com/glimmerjs/glimmer.js/pull/50) Update glimmer-vm packages to 0.29.9. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/component`, `@glimmer/test-utils`
  * [#46](https://github.com/glimmerjs/glimmer.js/pull/46) Async Boot. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/application`, `@glimmer/ssr`
  * [#45](https://github.com/glimmerjs/glimmer.js/pull/45) Introduce Builders. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/app-compiler`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`
  * [#39](https://github.com/glimmerjs/glimmer.js/pull/39) Broccoli bundle compiler. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/application`
  * [#34](https://github.com/glimmerjs/glimmer.js/pull/34) Separate Application responsibilities. ([@tomdale](https://github.com/tomdale))
* `@glimmer/compiler-delegates`
  * [#25](https://github.com/glimmerjs/glimmer.js/pull/25) Introduce @glimmer/compiler-delegates. ([@chadhietala](https://github.com/chadhietala))

#### :bug: Bug Fix
* `@glimmer/app-compiler`, `@glimmer/compiler-delegates`
  * [#54](https://github.com/glimmerjs/glimmer.js/pull/54) [BUGFIX] Fix data segment generation. ([@chadhietala](https://github.com/chadhietala))

#### :house: Internal
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`, `@glimmer/ssr`
  * [#52](https://github.com/glimmerjs/glimmer.js/pull/52) Bump Glimmer-VM deps to 0.29.10. ([@chadhietala](https://github.com/chadhietala))
* `@glimmer/app-compiler`, `@glimmer/application-test-helpers`, `@glimmer/application`, `@glimmer/compiler-delegates`, `@glimmer/component`, `@glimmer/test-utils`
  * [#44](https://github.com/glimmerjs/glimmer.js/pull/44) Fix publishing. ([@chadhietala](https://github.com/chadhietala))


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
2. Rename component files from dasherized to CapitalCase. For example, the
     `src/ui/components/user-profile` directory should be renamed to
     `src/ui/components/UserProfile`.
3. Change all component invocations from dasherized to `CapitalCase`. For
   example, change `<user-profile @user={{user}} />` to
   `<UserProfile @user={{user}} />`.

These are all of the changes that should be necessary to migrate an existing
app.

We've also introduced a new feature that makes it easier to take control of HTML
attributes. In 0.8.0, you can add `...attributes` to an element in a component's template,
and any attributes passed to the component will be applied to that element.

For example, imagine you have a `ProfileImage` component whose template contains
an `img` tag. You want anyone using this component to be able to treat it just
like an `img` element, including being able to set standard HTML attributes on
it. We'll add `...attributes` to the target element, like this:

```hbs
{{! src/ui/components/ProfileImage/template.hbs }}
<img ...attributes>
```

Now when invoking the component, any HTML attributes (i.e. anything without a `@` prefix) will be
transferred to the element with `...attributes` on it:

```hbs
{{! src/ui/components/Main/template.hbs }}
<ProfileImage
  @isAdmin={{isAdmin}} {{! not an attribute! }}
  src={{user.imageUrl}}
  role="complementary"
  data-is-awesome="yes-is-awesome"
  />
```

The final DOM will look something like this:

```html
<img
  src="/images/profiles/chad.jpg"
  role="complementary"
  data-is-awesome="yes-is-awesome">
```

For more information on these and other changes in Glimmer.js, make sure to
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
