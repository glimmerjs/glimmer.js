import {
  renderComponent,
  ComponentDefinition,
  RenderComponentOptions,
  didRender,
  setComponentTemplate,
  templateOnlyComponent,
} from '..';
import { renderToString } from '@glimmer/ssr';
import { SerializedTemplateWithLazyBlock } from '@glimmer/interfaces';
import { tracked as glimmerTracked } from '@glimmer/tracking';

import TrackedObject from './utils/tracked-object';

export const test = QUnit.test;

const IS_INTERACTIVE = typeof document !== 'undefined';

export async function render(
  component: ComponentDefinition | SerializedTemplateWithLazyBlock,
  options?: HTMLElement | Partial<RenderComponentOptions>
): Promise<string> {
  if ('id' in component && 'block' in component) {
    const template = component;

    component = setComponentTemplate(template, templateOnlyComponent());
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
  }
  return await renderToString(component, options as RenderComponentOptions);
}

export async function settled(): Promise<string> {
  if (!IS_INTERACTIVE) {
    throw new Error(
      'Attempted to `await settled()` in a non-interactive environment, such as SSR. Non-interactive environments will never update, usually because they only render once, so awaiting settled does not make sense. This is probably a non-SSR test that accidentally ran in SSR.'
    );
  }

  await didRender();

  return document.getElementById('qunit-fixture')!.innerHTML;
}

export function tracked<T extends object>(obj: T | typeof Object): T;

export function tracked(obj: object, key: string | symbol, desc?: PropertyDescriptor): void;

export function tracked(
  obj: object,
  key?: string | symbol,
  desc?: PropertyDescriptor
): object | void {
  if (key !== undefined && desc !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (glimmerTracked as any)(obj, key as string, desc);
  }

  switch (obj) {
    case Object:
      return new TrackedObject();
  }

  return new TrackedObject(obj);
}
