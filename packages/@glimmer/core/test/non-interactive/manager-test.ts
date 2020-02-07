const { module, test } = QUnit;

import { setComponentManager } from '../..';
import { getComponentManager } from '../../src/managers';

module('component managers', () => {
  test('setting and getting', assert => {
    const context = {};

    const managerA = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const managerAAB = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    class A {}
    setComponentManager(() => managerA, A);
    class AA extends A {}
    class AB extends A {}
    class AAA extends AA {}
    class AAB extends AA {}
    setComponentManager(() => managerAAB, AAB);

    class B {}
    class BA {}

    assert.strictEqual(
      getComponentManager(context, A),
      managerA,
      'class A returns explicitly associated manager'
    );

    assert.strictEqual(
      getComponentManager(context, AA),
      managerA,
      'class AA returns inherited manager from parent'
    );

    assert.strictEqual(
      getComponentManager(context, AB),
      managerA,
      'class AA returns inherited manager from parent'
    );

    assert.strictEqual(
      getComponentManager(context, AAA),
      managerA,
      'class AAA returns inherited manager from grandparent'
    );

    assert.strictEqual(
      getComponentManager(context, AAB),
      managerAAB,
      'class AAA returns explicitly associated manager'
    );

    assert.strictEqual(
      getComponentManager(context, AAB),
      managerAAB,
      'class AAA returns explicitly associated manager'
    );

    assert.strictEqual(
      getComponentManager(context, B),
      undefined,
      'class B returns undefined manager'
    );

    assert.strictEqual(
      getComponentManager(context, BA),
      undefined,
      'class BA returns undefined manager'
    );
  });
});
