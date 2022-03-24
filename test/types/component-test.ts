import { expectTypeOf } from 'expect-type';
import * as gc from '@glimmer/component';

// Imported from non-public-API so we can check that we are publishing what we
// expect to be -- and this keeps us honest about the fact that if we *change*
// this import location, we've broken any existing declarations published using
// the current type signatures.
import { EmptyObject } from '@glimmer/component/addon/-private/component';

const Component = gc.default;

expectTypeOf(gc).toHaveProperty('default');
expectTypeOf(gc.default).toEqualTypeOf<typeof Component>();

type Args = {
  foo: number;
};

const componentWithLegacyArgs = new Component<Args>({}, { foo: 123 });
expectTypeOf(componentWithLegacyArgs).toHaveProperty('args');
expectTypeOf(componentWithLegacyArgs).toHaveProperty('isDestroying');
expectTypeOf(componentWithLegacyArgs).toHaveProperty('isDestroyed');
expectTypeOf(componentWithLegacyArgs).toHaveProperty('willDestroy');
expectTypeOf(componentWithLegacyArgs.args).toEqualTypeOf<Readonly<Args>>();
expectTypeOf(componentWithLegacyArgs.isDestroying).toEqualTypeOf<boolean>();
expectTypeOf(componentWithLegacyArgs.isDestroyed).toEqualTypeOf<boolean>();
expectTypeOf(componentWithLegacyArgs.willDestroy).toEqualTypeOf<() => void>();

interface ArgsOnly {
  Args: Args;
}

const componentWithArgsOnly = new Component<ArgsOnly>({}, { foo: 123 });
expectTypeOf(componentWithArgsOnly.args).toEqualTypeOf<Readonly<Args>>();

interface ElementOnly {
  Element: HTMLParagraphElement;
}

const componentWithElOnly = new Component<ElementOnly>({}, {});

expectTypeOf(componentWithElOnly.args).toEqualTypeOf<Readonly<EmptyObject>>();

interface Blocks {
  default: [name: string];
  inverse: [];
}

interface BlockOnlySig {
  Blocks: Blocks;
}

const componentWithBlockOnly = new Component<BlockOnlySig>({}, {});

expectTypeOf(componentWithBlockOnly.args).toEqualTypeOf<Readonly<EmptyObject>>();

interface ArgsAndBlocks {
  Args: Args;
  Blocks: Blocks;
}

const componentwithArgsAndBlocks = new Component<ArgsAndBlocks>({}, { foo: 123 });
expectTypeOf(componentwithArgsAndBlocks.args).toEqualTypeOf<Readonly<Args>>();

interface ArgsAndEl {
  Args: Args;
  Element: HTMLParagraphElement;
}

const componentwithArgsAndEl = new Component<ArgsAndEl>({}, { foo: 123 });
expectTypeOf(componentwithArgsAndEl.args).toEqualTypeOf<Readonly<Args>>();

interface FullShortSig {
  Args: Args;
  Element: HTMLParagraphElement;
  Blocks: Blocks;
}

const componentWithFullShortSig = new Component<FullShortSig>({}, { foo: 123 });
expectTypeOf(componentWithFullShortSig.args).toEqualTypeOf<Readonly<Args>>();

interface FullLongSig {
  Args: {
    Named: Args;
    Positional: [];
  };
  Element: HTMLParagraphElement;
  Blocks: {
    default: {
      Params: {
        Positional: [name: string];
      };
    };
  };
}

const componentWithFullSig = new Component<FullLongSig>({}, { foo: 123 });
expectTypeOf(componentWithFullSig.args).toEqualTypeOf<Readonly<Args>>();
