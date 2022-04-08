import { expectTypeOf } from 'expect-type';

// Intentionally checking the shape of the exports *and* the export itself.
import * as gc from '@glimmer/component';
// tslint:disable-next-line: no-duplicate-imports
import Component from '@glimmer/component';

// Imported from non-public-API so we can check that we are publishing what we
// expect to be -- and this keeps us honest about the fact that if we *change*
// this import location, we've broken any existing declarations published using
// the current type signatures.
import { EmptyObject, ExpandSignature } from '@glimmer/component/addon/-private/component';

declare let basicComponent: Component;
expectTypeOf(basicComponent).toHaveProperty('args');
expectTypeOf(basicComponent).toHaveProperty('isDestroying');
expectTypeOf(basicComponent).toHaveProperty('isDestroyed');
expectTypeOf(basicComponent).toHaveProperty('willDestroy');
expectTypeOf(basicComponent.isDestroying).toEqualTypeOf<boolean>();
expectTypeOf(basicComponent.isDestroyed).toEqualTypeOf<boolean>();
expectTypeOf(basicComponent.willDestroy).toEqualTypeOf<() => void>();

expectTypeOf(gc).toHaveProperty('default');
expectTypeOf(gc.default).toEqualTypeOf<typeof Component>();

type LegacyArgs = {
  foo: number;
};

const componentWithLegacyArgs = new Component<LegacyArgs>({}, { foo: 123 });
expectTypeOf(componentWithLegacyArgs.args).toEqualTypeOf<Readonly<LegacyArgs>>();

expectTypeOf<ExpandSignature<LegacyArgs>>().toEqualTypeOf<{
  Args: { Named: LegacyArgs; Positional: [] };
  Element: null;
  Blocks: EmptyObject;
}>();

// Here, we are testing that the types propertly distribute over union types,
// generics which extend other types, etc.
// Here, we are testing that the types propertly distribute over union types,
// generics which extend other types, etc.
type LegacyArgsDistributive = { foo: number } | { bar: string; baz: boolean };

const legacyArgsDistributiveA = new Component<LegacyArgsDistributive>({}, { foo: 123 });
expectTypeOf(legacyArgsDistributiveA.args).toEqualTypeOf<Readonly<LegacyArgsDistributive>>();
const legacyArgsDistributiveB = new Component<LegacyArgsDistributive>(
  {},
  { bar: 'hello', baz: true }
);
expectTypeOf(legacyArgsDistributiveB.args).toEqualTypeOf<Readonly<LegacyArgsDistributive>>();

expectTypeOf<ExpandSignature<LegacyArgsDistributive>>().toEqualTypeOf<
  | {
      Args: { Named: { foo: number }; Positional: [] };
      Element: null;
      Blocks: EmptyObject;
    }
  | {
      Args: { Named: { bar: string; baz: boolean }; Positional: [] };
      Element: null;
      Blocks: EmptyObject;
    }
>();

interface ExtensibleLegacy<T> {
  value: T;
  extras: boolean;
  funThings: string[];
}

class WithExtensibleLegacy<T extends ExtensibleLegacy<unknown>> extends Component<T> {}
declare const withExtensibleLegacy: WithExtensibleLegacy<ExtensibleLegacy<unknown>>;
expectTypeOf(withExtensibleLegacy.args.value).toEqualTypeOf<unknown>();
expectTypeOf(withExtensibleLegacy.args.extras).toEqualTypeOf<boolean>();
expectTypeOf(withExtensibleLegacy.args.funThings).toEqualTypeOf<string[]>();

class WithExtensibleLegacySubclass extends WithExtensibleLegacy<ExtensibleLegacy<string>> {}
declare const withExtensibleLegacySubclass: WithExtensibleLegacySubclass;
expectTypeOf(withExtensibleLegacySubclass.args.value).toEqualTypeOf<string>();

interface ArgsOnly {
  Args: LegacyArgs;
}

const componentWithArgsOnly = new Component<ArgsOnly>({}, { foo: 123 });
expectTypeOf(componentWithArgsOnly.args).toEqualTypeOf<Readonly<LegacyArgs>>();

expectTypeOf<ExpandSignature<ArgsOnly>>().toEqualTypeOf<{
  Args: { Named: LegacyArgs; Positional: [] };
  Element: null;
  Blocks: EmptyObject;
}>();

interface ElementOnly {
  Element: HTMLParagraphElement;
}

const componentWithElOnly = new Component<ElementOnly>({}, {});

expectTypeOf(componentWithElOnly.args).toEqualTypeOf<Readonly<EmptyObject>>();

expectTypeOf<ExpandSignature<ElementOnly>>().toEqualTypeOf<{
  Args: { Named: EmptyObject; Positional: [] };
  Element: HTMLParagraphElement;
  Blocks: EmptyObject;
}>();

interface Blocks {
  default: [name: string];
  inverse: [];
}

interface BlockOnlySig {
  Blocks: Blocks;
}

const componentWithBlockOnly = new Component<BlockOnlySig>({}, {});

expectTypeOf(componentWithBlockOnly.args).toEqualTypeOf<Readonly<EmptyObject>>();

expectTypeOf<ExpandSignature<BlockOnlySig>>().toEqualTypeOf<{
  Args: { Named: EmptyObject; Positional: [] };
  Element: null;
  Blocks: {
    default: {
      Params: {
        Positional: [name: string];
      };
    };
    inverse: {
      Params: {
        Positional: [];
      };
    };
  };
}>();

interface ArgsAndBlocks {
  Args: LegacyArgs;
  Blocks: Blocks;
}

const componentwithArgsAndBlocks = new Component<ArgsAndBlocks>({}, { foo: 123 });
expectTypeOf(componentwithArgsAndBlocks.args).toEqualTypeOf<Readonly<LegacyArgs>>();

expectTypeOf<ExpandSignature<ArgsAndBlocks>>().toEqualTypeOf<{
  Args: { Named: LegacyArgs; Positional: [] };
  Element: null;
  Blocks: {
    default: {
      Params: {
        Positional: [name: string];
      };
    };
    inverse: {
      Params: {
        Positional: [];
      };
    };
  };
}>();

interface ArgsAndEl {
  Args: LegacyArgs;
  Element: HTMLParagraphElement;
}

const componentwithArgsAndEl = new Component<ArgsAndEl>({}, { foo: 123 });
expectTypeOf(componentwithArgsAndEl.args).toEqualTypeOf<Readonly<LegacyArgs>>();

expectTypeOf<ExpandSignature<ArgsAndEl>>().toEqualTypeOf<{
  Args: { Named: LegacyArgs; Positional: [] };
  Element: HTMLParagraphElement;
  Blocks: EmptyObject;
}>();

interface FullShortSig {
  Args: LegacyArgs;
  Element: HTMLParagraphElement;
  Blocks: Blocks;
}

const componentWithFullShortSig = new Component<FullShortSig>({}, { foo: 123 });
expectTypeOf(componentWithFullShortSig.args).toEqualTypeOf<Readonly<LegacyArgs>>();

expectTypeOf<ExpandSignature<FullShortSig>>().toEqualTypeOf<{
  Args: { Named: LegacyArgs; Positional: [] };
  Element: HTMLParagraphElement;
  Blocks: {
    default: {
      Params: {
        Positional: [name: string];
      };
    };
    inverse: {
      Params: {
        Positional: [];
      };
    };
  };
}>();

interface FullLongSig {
  Args: {
    Named: LegacyArgs;
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
expectTypeOf(componentWithFullSig.args).toEqualTypeOf<Readonly<LegacyArgs>>();

expectTypeOf<ExpandSignature<FullLongSig>>().toEqualTypeOf<FullLongSig>();
