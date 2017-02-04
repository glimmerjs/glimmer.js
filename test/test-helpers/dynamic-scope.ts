import {
  assign,
  Opaque
} from '@glimmer/util';
import {
  DynamicScope as GlimmerDynamicScope
} from '@glimmer/runtime';
import {
  PathReference
} from '@glimmer/reference';

export default class DynamicScope implements GlimmerDynamicScope {
  private bucket;

  constructor(bucket=null) {
    if (bucket) {
      this.bucket = assign({}, bucket);
    } else {
      this.bucket = {};
    }
  }

  get(key: string): PathReference<Opaque> {
    return this.bucket[key];
  }

  set(key: string, reference: PathReference<Opaque>) {
    return this.bucket[key] = reference;
  }

  child(): DynamicScope {
    return new DynamicScope(this.bucket);
  }
}
