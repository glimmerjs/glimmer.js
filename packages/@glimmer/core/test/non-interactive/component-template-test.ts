const { module, test } = QUnit;

import { getComponentTemplate, setComponentTemplate, TemplateMeta } from '../../src/template';
import { SerializedTemplateWithLazyBlock } from '@glimmer/interfaces';

class FakeTemplateMeta implements SerializedTemplateWithLazyBlock<TemplateMeta> {
  block = '{}';
  meta = {
    scope: (): {} => ({}),
  };
}

module('component templates', () => {
  test('setting and getting', (assert) => {
    const templateA = new FakeTemplateMeta();
    const templateAAB = new FakeTemplateMeta();

    class A {}
    setComponentTemplate(templateA, A);
    class AA extends A {}
    class AB extends A {}
    class AAA extends AA {}
    class AAB extends AA {}
    setComponentTemplate(templateAAB, AAB);

    class B {}
    class BA {}

    assert.strictEqual(
      getComponentTemplate(A),
      templateA,
      'class A returns explicitly associated template'
    );

    assert.strictEqual(
      getComponentTemplate(AA),
      templateA,
      'class AA returns inherited template from parent'
    );

    assert.strictEqual(
      getComponentTemplate(AB),
      templateA,
      'class AA returns inherited template from parent'
    );

    assert.strictEqual(
      getComponentTemplate(AAA),
      templateA,
      'class AAA returns inherited template from grandparent'
    );

    assert.strictEqual(
      getComponentTemplate(AAB),
      templateAAB,
      'class AAA returns explicitly associated template'
    );

    assert.strictEqual(
      getComponentTemplate(AAB),
      templateAAB,
      'class AAA returns explicitly associated template'
    );

    assert.strictEqual(getComponentTemplate(B), undefined, 'class B returns undefined template');

    assert.strictEqual(getComponentTemplate(BA), undefined, 'class BA returns undefined template');
  });
});
