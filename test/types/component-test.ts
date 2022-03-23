import { expectTypeOf } from 'expect-type';
import * as gc from '@glimmer/component';

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

// We cannot check on toEqualTypeOf here b/c EmptyObject is intentionally not
// public.
expectTypeOf(componentWithElOnly.args).toMatchTypeOf<Readonly<{}>>();

interface Blocks {
  default: [name: string];
  inverse: [];
}

interface BlockOnlySig {
  Blocks: Blocks;
}

const componentWithBlockOnly = new Component<BlockOnlySig>({}, {});

// We cannot check on toEqualTypeOf here b/c EmptyObject is intentionally not
// public.
expectTypeOf(componentWithBlockOnly.args).toMatchTypeOf<Readonly<{}>>();

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
