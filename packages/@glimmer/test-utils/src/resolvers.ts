import { Resolver, isSpecifierStringAbsolute } from '@glimmer/di';

export class BlankResolver implements Resolver {
  identify(specifier: string, referrer?: string): string {
    if (isSpecifierStringAbsolute(specifier)) {
      return specifier;
    } else {
      throw new Error(`Cannot identify invalid specifier ${specifier}`);
    }
  }
  retrieve(specifier: string): any {
  }
}
