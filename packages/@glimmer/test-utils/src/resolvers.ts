import { Resolver, isSpecifierStringAbsolute } from '@glimmer/di';

export class BlankResolver implements Resolver {
  identify(specifier: string, referrer?: string) {
    if (isSpecifierStringAbsolute(specifier)) {
      return specifier;
    }
  }
  retrieve(specifier: string): any {
  }
}
