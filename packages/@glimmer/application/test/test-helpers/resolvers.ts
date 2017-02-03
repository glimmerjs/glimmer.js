import { Resolver } from '@glimmer/di';

export class BlankResolver implements Resolver {
  identify(specifier: string, referrer?: string) { 
    return '';
  }
  retrieve(specifier: string): any {
  }
}
