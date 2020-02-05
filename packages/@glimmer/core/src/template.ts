import { SerializedTemplateWithLazyBlock, Dict } from '@glimmer/interfaces';
import { TemplateMeta } from './managers/component/custom';

const TEMPLATE_MAP = new WeakMap<object, SerializedTemplateWithLazyBlock<TemplateMeta>>();
const getPrototypeOf = Object.getPrototypeOf;

export function createTemplate(
  templateScopeOrTemplate: Dict<unknown> | string,
  template?: string
): SerializedTemplateWithLazyBlock<TemplateMeta> {
  let block;

  if (template === undefined) {
    // Babel transform does this type conversion
    block = (templateScopeOrTemplate as unknown) as SerializedTemplateWithLazyBlock<TemplateMeta>;

    block.meta.scope = () => ({});
  } else {
    // Babel transform does this type conversion
    block = (template as unknown) as SerializedTemplateWithLazyBlock<TemplateMeta>;

    block.meta.scope = () => templateScopeOrTemplate as Dict<unknown>;
  }

  return block;
}

export function setComponentTemplate<T extends object>(
  ComponentClass: T,
  template: SerializedTemplateWithLazyBlock<TemplateMeta>
): T {
  TEMPLATE_MAP.set(ComponentClass, template);
  return ComponentClass;
}

export function getComponentTemplate<T extends object>(ComponentClass: T) {
  let pointer = ComponentClass;

  while (pointer !== undefined && pointer !== null) {
    let manager = TEMPLATE_MAP.get(pointer);

    if (manager !== undefined) {
      return manager;
    }

    pointer = getPrototypeOf(pointer);
  }

  return undefined;
}
