# @glimmer/component

[![npm version](https://badge.fury.io/js/%40glimmer%2Fcomponent.svg)](https://badge.fury.io/js/%40glimmer%2Fcomponent)
[![Build Status](https://secure.travis-ci.org/glimmerjs/glimmer-component.svg?branch=master)](http://travis-ci.org/glimmerjs/glimmer-component)

## Installation

Add this package to your project with Yarn:

```bash
yarn add @glimmer/component
```

Or alternatively with npm:

```bash
npm install --save-dev @glimmer/component
```

## Usage

To use this in a Glimmer application, import the package and export an extended class:

```ts
import Component from '@glimmer/component';

export default class MyComponent extends Component {
}
```

## Development

For the development of this project, Yarn is preferred over npm. However, any Yarn command can be replaced by the npm equivalent.
See [Migration from npm](https://yarnpkg.com/lang/en/docs/migrating-from-npm/) in the Yarn documentation for a list of the equivalent commands.

* Clone repository locally: `git clone https://github.com/glimmerjs/glimmer-component.git`
* Install dependencies: `yarn`, or `yarn install`
* Open project in your editor of choice and make your changes
* Run tests: `yarn run test`

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/glimmerjs/glimmer-component.

## Acknowledgements

Thanks to [Monegraph](http://monegraph.com) for funding the initial development
of this library.

## License

MIT License.
