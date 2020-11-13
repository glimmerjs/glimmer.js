import { DEBUG } from '@glimmer/env';
import {
  SerializedTemplateWithLazyBlock,
  Dict,
  SerializedTemplateBlockJSON,
} from '@glimmer/interfaces';

export interface TemplateMeta {
  scope: () => Dict<unknown>;
}
export type TemplateScope = () => Dict<unknown>;

const TEMPLATE_MAP = new WeakMap<object, SerializedTemplateWithLazyBlock>();
const getPrototypeOf = Object.getPrototypeOf;

export const SCOPE_MAP = new WeakMap<SerializedTemplateWithLazyBlock, TemplateScope>();

export interface CustomSerializedTemplate {
  id?: string | null;
  block: SerializedTemplateBlockJSON;
  meta: TemplateMeta;
}

// This is provided by the `babel-plugin-strict-template-precompile` plugin
export let createTemplate: (
  scopeOrTemplate: Dict<unknown> | string,
  template?: string
) => CustomSerializedTemplate;

if (DEBUG) {
  createTemplate = (): CustomSerializedTemplate => {
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
  template: CustomSerializedTemplate,
  ComponentClass: T
): T {
  const {
    id,
    block,
    meta: { scope },
  } = template;

  if (DEBUG) {
    const evaluatedScope = scope();
    const parsed = JSON.parse(block);

    if (parsed.upvars) {
      for (const upvar of parsed.upvars) {
        if (!(upvar in builtInHelpers) && evaluatedScope[upvar] === undefined) {
          throw new Error(
            `Cannot find identifier \`${upvar}\` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add \`this\` to it: \`{{this.${upvar}}}\``
          );
        }
      }
    }
  }

  const newTemplate = { id, block, moduleName: '(unknown module)' };

  SCOPE_MAP.set(newTemplate, scope);

  TEMPLATE_MAP.set(ComponentClass, newTemplate);
  return ComponentClass;
}

export function getComponentTemplate<T extends object>(
  ComponentClass: T
): SerializedTemplateWithLazyBlock | undefined {
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
