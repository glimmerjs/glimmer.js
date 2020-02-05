import { renderComponent, ComponentFactory, RenderComponentOptions, didRender, templateOnlyComponent, setComponentTemplate } from '..';
import { renderToString } from '@glimmer/ssr';
import { Dict, SerializedTemplateWithLazyBlock } from '@glimmer/interfaces';
import { TemplateMeta } from '../src/managers/component/custom';

export const module = QUnit.module;
export const test = QUnit.test;

const IS_INTERACTIVE = typeof document !== 'undefined';

export async function render(
  component: ComponentFactory | SerializedTemplateWithLazyBlock<TemplateMeta>,
  options?: Element | {
    element?: Element;
    args?: Dict<unknown>;
    scope?: Dict<unknown>;
  }
): Promise<string> {
  if ('id' in component && 'block' in component && 'meta' in component) {
    let template = component;

    component = templateOnlyComponent();

    setComponentTemplate(component, template);
  }

  if (IS_INTERACTIVE) {
    const element = document.getElementById('qunit-fixture')!;
    element.innerHTML = '';

    if (options) {
      if (!(options instanceof Element) && !(options.element instanceof Element)) {
        options.element = element;
      }

      await renderComponent(component, options as RenderComponentOptions);
    } else {
      await renderComponent(component, element);
    }

    return element.innerHTML;
  } else {
    return await renderToString(component, options as RenderComponentOptions);
  }
}

export async function settled() {
  if (!IS_INTERACTIVE) {
    throw new Error('Attempted to `await settled()` in a non-interactive environment, such as SSR. Non-interactive environments will never update, usually because they only render once, so awaiting settled does not make sense. This is probably a non-SSR test that accidentally ran in SSR.');
  }

  await didRender();

  return document.getElementById('qunit-fixture')!.innerHTML;
}
