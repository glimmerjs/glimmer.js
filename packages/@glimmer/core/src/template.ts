import { DEBUG } from '@glimmer/env';
import { setComponentTemplate as vmSetComponentTemplate } from '@glimmer/manager';
import { SerializedTemplateWithLazyBlock, Dict } from '@glimmer/interfaces';
import { templateFactory } from '@glimmer/opcode-compiler';

// This is provided by the `babel-plugin-strict-template-precompile` plugin
export let createTemplate: (
  scopeOrTemplate: Dict<unknown> | string,
  template?: string
) => SerializedTemplateWithLazyBlock;

if (DEBUG) {
  createTemplate = (): SerializedTemplateWithLazyBlock => {
    throw new Error(
      'createTemplate() is meant to be preprocessed with a babel plugin, @glimmer/babel-plugin-strict-template-precompile. If you are seeing this error message, it means that you do not have this babel plugin installed, or it is not enabled correctly'
    );
  };
}

export function setComponentTemplate(
  template: SerializedTemplateWithLazyBlock,
  ComponentClass: object
): object {
  return vmSetComponentTemplate(templateFactory(template), ComponentClass);
}
