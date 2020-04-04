import { DEBUG } from '@glimmer/env';
import { SerializedTemplateWithLazyBlock, Dict } from '@glimmer/interfaces';

export interface TemplateMeta {
  scope: () => Dict<unknown>;
}

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

const builtInHelpers = {
  if: true,
  each: true,
};

export function setComponentTemplate<T extends object>(
  template: SerializedTemplateWithLazyBlock<TemplateMeta>,
  ComponentClass: T
): T {
  if (DEBUG) {
    const scope = template.meta.scope();
    const block = JSON.parse(template.block);

    if (block.upvars) {
      for (const upvar of block.upvars) {
        if (!(upvar in builtInHelpers) && scope[upvar] === undefined) {
          throw new Error(
            `Cannot find identifier \`${upvar}\` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add \`this\` to it: \`{{this.${upvar}}}\``
          );
        }
      }
    }
  }

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
