# @glimmer/tracking

[![npm version](https://badge.fury.io/js/%40glimmer%2Ftracking.svg)](https://badge.fury.io/js/%40glimmer%2Ftracking)
[![CI](https://github.com/glimmerjs/glimmer.js/workflows/CI/badge.svg)](https://github.com/glimmerjs/glimmer.js/actions?query=workflow%3ACI)

## Installation

Add this package to your project with Yarn:

```bash
yarn add -D @glimmer/tracking
```

Or alternatively with npm:

```bash
npm install --save-dev @glimmer/tracking
```

## Usage

To use this in a Glimmer application, import the package and export an extended class:

```ts
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class MyComponent extends Component {
  @tracked foo;
}
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/glimmerjs/glimmer.js.

## Acknowledgements

Thanks to [Monegraph](http://monegraph.com) for funding the initial development
of this library.

## License

MIT License.
