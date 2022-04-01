import { expectTypeOf } from 'expect-type';
import * as gc from '@glimmer/component';
import Component from '@glimmer/component';

// Imported from non-public-API so we can check that we are publishing what we
// expect to be -- and this keeps us honest about the fact that if we *change*
// this import location, we've broken any existing declarations published using
// the current type signatures.
//
// NOTE: this *will not* type-check until you have done a build, because it is
// the result of emitting types to the production build location. However, this
// matches the actual import location to which this type would be emitted. Since
// this is an internal-only type whose presence consumers should not rely on and
// which they should not use in any way, this is "safe" from a public API POV.
import { EmptyObject } from '@glimmer/component/dist/types/addon/-private/component';

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

// Here, we are testing that the types propertly distribute over union types,
// generics which extend other types, etc.
type LegacyArgsDistributive = { foo: number } | { bar: string; baz: boolean };

const legacyArgsDistributiveA = new Component<LegacyArgsDistributive>({}, { foo: 123 });
expectTypeOf(legacyArgsDistributiveA.args).toEqualTypeOf<Readonly<LegacyArgsDistributive>>();
const legacyArgsDistributiveB = new Component<LegacyArgsDistributive>({}, { bar: "hello", baz: true });
expectTypeOf(legacyArgsDistributiveB.args).toEqualTypeOf<Readonly<LegacyArgsDistributive>>();

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

interface Extended extends ExtensibleLegacy<string> {}

class WithExtensibleLegacySubclass extends WithExtensibleLegacy<Extended> {}
declare const withExtensibleLegacySubclass: WithExtensibleLegacySubclass;
expectTypeOf(withExtensibleLegacySubclass.args.value).toEqualTypeOf<string>();

interface ArgsOnly {
  Args: LegacyArgs;
}

const componentWithArgsOnly = new Component<ArgsOnly>({}, { foo: 123 });
expectTypeOf(componentWithArgsOnly.args).toEqualTypeOf<Readonly<LegacyArgs>>();

interface ElementOnly {
  Element: HTMLParagraphElement;
}

const componentWithElOnly = new Component<ElementOnly>({}, {});

expectTypeOf(componentWithElOnly.args).toEqualTypeOf<Readonly<EmptyObject>>();

interface Blocks {
  default: [string];
  inverse: [];
}

interface BlockOnlySig {
  Blocks: Blocks;
}

const componentWithBlockOnly = new Component<BlockOnlySig>({}, {});

expectTypeOf(componentWithBlockOnly.args).toEqualTypeOf<Readonly<EmptyObject>>();

interface ArgsAndBlocks {
  Args: LegacyArgs;
  Blocks: Blocks;
}

const componentwithArgsAndBlocks = new Component<ArgsAndBlocks>({}, { foo: 123 });
expectTypeOf(componentwithArgsAndBlocks.args).toEqualTypeOf<Readonly<LegacyArgs>>();

interface ArgsAndEl {
  Args: LegacyArgs;
  Element: HTMLParagraphElement;
}

const componentwithArgsAndEl = new Component<ArgsAndEl>({}, { foo: 123 });
expectTypeOf(componentwithArgsAndEl.args).toEqualTypeOf<Readonly<LegacyArgs>>();

interface FullShortSig {
  Args: LegacyArgs;
  Element: HTMLParagraphElement;
  Blocks: Blocks;
}

const componentWithFullShortSig = new Component<FullShortSig>({}, { foo: 123 });
expectTypeOf(componentWithFullShortSig.args).toEqualTypeOf<Readonly<LegacyArgs>>();

interface FullLongSig {
  Args: {
    Named: LegacyArgs;
    Positional: [];
  };
  Element: HTMLParagraphElement;
  Blocks: {
    default: {
      Params: {
        Positional: [string];
      };
    };
  };
}

const componentWithFullSig = new Component<FullLongSig>({}, { foo: 123 });
expectTypeOf(componentWithFullSig.args).toEqualTypeOf<Readonly<LegacyArgs>>();
