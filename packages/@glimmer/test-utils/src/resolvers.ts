import { Resolver, isSpecifierStringAbsolute } from '@glimmer/di';

export class BlankResolver implements Resolver {
  identify(specifier: string, referrer?: string): string {
    if (isSpecifierStringAbsolute(specifier)) {
      return specifier;
    }
    throw new Error(`Unexpected non-absolute specifier ${specifier}`);
  }
  retrieve(specifier: string): any {}
}
