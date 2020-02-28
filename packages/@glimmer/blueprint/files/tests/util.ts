import {
  renderComponent as glimmerRenderComponent,
  ComponentDefinition,
  RenderComponentOptions,
  didRender,
} from '@glimmer/core';

// Bootstrap QUnit
import 'qunit';
import 'qunit/qunit/qunit.css';
import 'qunit-dom/dist/qunit-dom';

QUnit.start();

const getTestRoot = (): HTMLElement => document.getElementById('qunit-fixture');

// Setup QUnit.dom
Object.defineProperty(QUnit.assert.dom, 'rootElement', { get: getTestRoot });

// This renderComponent helper will automatically find the root of the test
// context and render to it, so you don't have to do that for every test. You
// can still override the element by passing it directly, in cases where that
// is necessary.
export async function renderComponent(
  component: ComponentDefinition,
  elementOrOptions: HTMLElement | Partial<RenderComponentOptions> = {}
): Promise<void> {
  let options: RenderComponentOptions;

  if (elementOrOptions instanceof HTMLElement) {
    options = { element: elementOrOptions };
  } else {
    const element =
      elementOrOptions.element instanceof HTMLElement ? elementOrOptions.element : getTestRoot();

    options = { ...elementOrOptions, element };
  }

  await glimmerRenderComponent(component, options);
}

// re-export QUnit modules for convenience
export const module = QUnit.module;
export const test = QUnit.test;

// Re-export didRender for convenience
export { didRender };
