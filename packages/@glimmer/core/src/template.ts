import { DEBUG } from '@glimmer/env';
import { TemplateFactory } from '@glimmer/interfaces';

// This is provided by `@glimmer/babel-preset`
export let precompileTemplate: (
  template: string,
  options?: {
    strictMode?: boolean;
    scope?: Record<string, unknown>;
  }
) => TemplateFactory;

if (DEBUG) {
  precompileTemplate = (): TemplateFactory => {
    throw new Error(
      'precompileTemplate() is meant to be preprocessed with babel, using @glimmer/babel-preset. If you are seeing this error message, it means that you do not have this babel preset installed, or it is not enabled correctly'
    );
  };
}
