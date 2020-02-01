const { module, test } = QUnit;

import { setComponentTemplate, getComponentTemplate } from '..';

module('component templates', () => {
  test('setting and getting', assert => {
    const templateA = {} as any;
    const templateAAB = {} as any;

    class A {}
    setComponentTemplate(A, templateA);
    class AA extends A {}
    class AB extends A {}
    class AAA extends AA {}
    class AAB extends AA {}
    setComponentTemplate(AAB, templateAAB);

    class B {}
    class BA {}

    assert.strictEqual(
      getComponentTemplate(A),
      templateA,
      'class A returns explicitly associated manager'
    );

    assert.strictEqual(
      getComponentTemplate(AA),
      templateA,
      'class AA returns inherited manager from parent'
    );

    assert.strictEqual(
      getComponentTemplate(AB),
      templateA,
      'class AA returns inherited manager from parent'
    );

    assert.strictEqual(
      getComponentTemplate(AAA),
      templateA,
      'class AAA returns inherited manager from grandparent'
    );

    assert.strictEqual(
      getComponentTemplate(AAB),
      templateAAB,
      'class AAA returns explicitly associated manager'
    );

    assert.strictEqual(
      getComponentTemplate(AAB),
      templateAAB,
      'class AAA returns explicitly associated manager'
    );

    assert.strictEqual(getComponentTemplate(B), null, 'class B returns null manager');

    assert.strictEqual(getComponentTemplate(BA), null, 'class BA returns null manager');
  });
});
