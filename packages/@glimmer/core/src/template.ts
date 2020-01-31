import { SerializedTemplateWithLazyBlock, Dict } from '@glimmer/interfaces';
import { TemplateMeta } from './managers/component/custom';

const TEMPLATE_MAP = new WeakMap<object, SerializedTemplateWithLazyBlock<TemplateMeta>>();

export function createTemplate(
  scope: Dict<unknown>,
  block: SerializedTemplateWithLazyBlock<TemplateMeta>
): SerializedTemplateWithLazyBlock<TemplateMeta> {
  block.meta.scope = () => scope;

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
  return TEMPLATE_MAP.get(ComponentClass);
}
