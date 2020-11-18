const { module, test } = QUnit;

import {
  getComponentTemplate,
  setComponentTemplate,
  CustomSerializedTemplate,
} from '../../src/template';
import { SerializedTemplateWithLazyBlock } from '@glimmer/interfaces';

class FakeTemplate implements CustomSerializedTemplate {
  constructor(public block: string) {}

  meta = {
    scope: (): {} => ({}),
  };
}

function makeInternalTemplate(block: string): SerializedTemplateWithLazyBlock {
  return {
    block,
    id: undefined,
    moduleName: '(unknown module)',
  };
}

module('component templates', () => {
  test('setting and getting', (assert) => {
    const templateA = new FakeTemplate('{ "foo": "A" }');
    const templateAAB = new FakeTemplate('{ "foo": "AAB" }');

    const internalTemplateA = makeInternalTemplate('{ "foo": "A" }');
    const internalTemplateAAB = makeInternalTemplate('{ "foo": "AAB" }');

    class A {}
    setComponentTemplate(templateA, A);
    class AA extends A {}
    class AB extends A {}
    class AAA extends AA {}
    class AAB extends AA {}
    setComponentTemplate(templateAAB, AAB);

    class B {}
    class BA {}

    assert.deepEqual(
      getComponentTemplate(A),
      internalTemplateA,
      'class A returns explicitly associated template'
    );

    assert.deepEqual(
      getComponentTemplate(AA),
      internalTemplateA,
      'class AA returns inherited template from parent'
    );

    assert.deepEqual(
      getComponentTemplate(AB),
      internalTemplateA,
      'class AA returns inherited template from parent'
    );

    assert.deepEqual(
      getComponentTemplate(AAA),
      internalTemplateA,
      'class AAA returns inherited template from grandparent'
    );

    assert.deepEqual(
      getComponentTemplate(AAB),
      internalTemplateAAB,
      'class AAA returns explicitly associated template'
    );

    assert.deepEqual(
      getComponentTemplate(AAB),
      internalTemplateAAB,
      'class AAA returns explicitly associated template'
    );

    assert.strictEqual(getComponentTemplate(B), undefined, 'class B returns undefined template');

    assert.strictEqual(getComponentTemplate(BA), undefined, 'class BA returns undefined template');
  });
});
