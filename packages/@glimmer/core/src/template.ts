import { DEBUG } from '@glimmer/env';
import { SerializedTemplateWithLazyBlock, Dict } from '@glimmer/interfaces';
import { TemplateMeta } from './managers/component/custom';

const TEMPLATE_MAP = new WeakMap<object, SerializedTemplateWithLazyBlock<TemplateMeta>>();
const getPrototypeOf = Object.getPrototypeOf;

// This is provided by the `babel-plugin-strict-template-precompile` plugin
export let createTemplate: (
  scopeOrTemplate: Dict<unknown> | string,
  template?: string
) => SerializedTemplateWithLazyBlock<TemplateMeta>;

if (DEBUG) {
  createTemplate = (): SerializedTemplateWithLazyBlock<TemplateMeta> => {
    throw new Error(
      'createTemplate() is meant to be preprocessed with a babel plugin, @glimmer/babel-plugin-strict-template-precompile. If you are seeing this error message, it means that you do not have this babel plugin installed, or it is not enabled correctly'
    );
  };
}

export function setComponentTemplate<T extends object>(
  ComponentClass: T,
  template: SerializedTemplateWithLazyBlock<TemplateMeta>
): T {
  TEMPLATE_MAP.set(ComponentClass, template);
  return ComponentClass;
}

export function getComponentTemplate<T extends object>(
  ComponentClass: T
): SerializedTemplateWithLazyBlock<TemplateMeta> | undefined {
  let pointer = ComponentClass;

  while (pointer !== undefined && pointer !== null) {
    const manager = TEMPLATE_MAP.get(pointer);

    if (manager !== undefined) {
      return manager;
    }

    pointer = getPrototypeOf(pointer);
  }

  return undefined;
}
