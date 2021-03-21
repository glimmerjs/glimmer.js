import { DEBUG } from '@glimmer/env';
import { assert, deprecate } from '@glimmer/debug';
import { precompileTemplate } from '@glimmer/core';
import { tracked } from '@glimmer/tracking';

if (DEBUG) {
  console.log('DEBUG!');
}

assert(true, 'is true');
deprecate('this is deprecated', false, { id: 'foo' });


class Test {
  @tracked bar = 123;
}

precompileTemplate('Hello, world!', { strictMode: true, scope: { Test } });
