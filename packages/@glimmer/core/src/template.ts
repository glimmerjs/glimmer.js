import { SerializedTemplateWithLazyBlock, Dict } from '@glimmer/interfaces';
import { TemplateMeta } from './managers/component/custom';

const TEMPLATE_MAP = new WeakMap<object, SerializedTemplateWithLazyBlock<TemplateMeta>>();
const getPrototypeOf = Object.getPrototypeOf;

// This is provided by the `babel-plugin-strict-template-precompile` plugin
export declare function createTemplate(
  templateScopeOrTemplate: Dict<unknown> | string,
  template?: string
): SerializedTemplateWithLazyBlock<TemplateMeta>;

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
