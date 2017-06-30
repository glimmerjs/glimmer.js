import {
  getOwner,
  setOwner,
  Factory,
  Owner
} from "@glimmer/di";
import {
  Bounds,
  ComponentManager as GlimmerComponentManager,
  DynamicScope,
  Environment,
  CompiledDynamicProgram,
  Arguments,
  Template,
  CapturedArguments,
  compileLayout,
  ComponentLayoutBuilder
} from "@glimmer/runtime";
import {
  TemplateMeta
} from "@glimmer/wire-format";
import Component from "./component";
import ComponentDefinition from "./component-definition";
import { RootReference } from "./references";
import { Dict, Destroyable, Opaque } from "@glimmer/util";
import { Tag } from "@glimmer/reference";
import { Simple } from "@glimmer/interfaces";

export interface ConstructorOptions {
  env: Environment;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(definition: ComponentDefinition, args: CapturedArguments, owner: Owner) {
    let componentFactory = definition.componentFactory;
    let name = definition.name;

    this.args = args;

    let injections = {
      debugName: name,
      args: this.namedArgsSnapshot()
    };

    setOwner(injections, owner);
    this.component = componentFactory.create(injections);
  }

  get tag(): Tag {
    return this.args.tag;
  }

  namedArgsSnapshot(): Readonly<Dict<Opaque>> {
    return Object.freeze(this.args.named.value());
  }
}

class LayoutCompiler {
  name: string;
  template: Template<TemplateMeta>;

  constructor(name: string, template: Template<TemplateMeta>) {
    this.template = template;
    this.name = name;
  }

  compile(builder: ComponentLayoutBuilder): void {
    builder.fromLayout(this.name, this.template);
  }
}

export default class ComponentManager implements GlimmerComponentManager<ComponentStateBucket> {
  private env: Environment;

  static create(options: ConstructorOptions): ComponentManager {
    return new ComponentManager(options);
  }

  constructor(options: ConstructorOptions) {
    this.env = options.env;
  }

  prepareArgs(definition: ComponentDefinition, args: Arguments): null {
    return null;
  }

  create(environment: Environment, definition: ComponentDefinition, volatileArgs: Arguments): ComponentStateBucket {
    let owner = getOwner(this.env);
    return new ComponentStateBucket(definition, volatileArgs.capture(), owner);
  }

  createComponentDefinition(name: string, template: Template<any>, componentFactory?: Factory<Component>): ComponentDefinition {
    if (!componentFactory) {
      componentFactory = {
        class: Component,
        create(injections: object) {
          return this.class.create(injections);
        }
      }
    }

    return new ComponentDefinition(name, this, template, componentFactory);
  }

  layoutFor(definition: ComponentDefinition, bucket: ComponentStateBucket, env: Environment): CompiledDynamicProgram {
    let template = definition.template;

    return compileLayout(new LayoutCompiler(definition.name, template), this.env);
  }

  getSelf(bucket: ComponentStateBucket): RootReference {
    return new RootReference(bucket.component);
  }

  didCreateElement(bucket: ComponentStateBucket, element: Simple.Element) {
    if (!bucket) { return; }
    bucket.component.element = element;
  }

  didRenderLayout(bucket: ComponentStateBucket, bounds: Bounds) {
  }

  didCreate(bucket: ComponentStateBucket) {
    bucket && bucket.component.didInsertElement();
  }

  getTag({ tag }: ComponentStateBucket): Tag {
    return tag;
  }

  update(bucket: ComponentStateBucket, scope: DynamicScope) {
  }

  didUpdateLayout() {}

  didUpdate(bucket: ComponentStateBucket) {
    if (!bucket) { return; }

    // TODO: This should be moved to `didUpdate`, but there's currently a
    // Glimmer bug that causes it not to be called if the layout doesn't update.
    let { component } = bucket;

    component.args = bucket.namedArgsSnapshot();
    component.didUpdate();
  }

  getDestructor(bucket: ComponentStateBucket): Destroyable {
    return bucket.component;
  }
}
