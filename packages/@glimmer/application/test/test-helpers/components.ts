import { ComponentManager, ComponentDefinition, Arguments, CompiledDynamicProgram, Template, Bounds, DynamicScope } from '@glimmer/runtime';
import { Factory } from '@glimmer/di';
import ComponentDefinitionCreator from '../../src/component-definition-creator';
import Environment from "../../src/environment";
import TemplateMeta from '../../src/template-meta';
import { UpdatableReference } from '@glimmer/object-reference';

export class TestComponent {
  element: Element;
}

class TestComponentDefinition extends ComponentDefinition<TestComponent> {
  componentFactory: Factory<TestComponent>;
  template: Template<TemplateMeta>;

  constructor(name: string, manager: TestComponentManager, template: Template<TemplateMeta>, componentFactory: Factory<TestComponent>) {
    super(name, manager, null);

    this.template = template;
    this.componentFactory = componentFactory;
  }

  toJSON() {
    return `<test-component-definition name=${this.name}>`;
  }
}

export class TestComponentManager implements ComponentManager<TestComponent>, ComponentDefinitionCreator {
  private env: Environment;

  constructor(env: Environment) {
    this.env = env;
  }

  static create(env: Environment): TestComponentManager {
    return new TestComponentManager(env);
  }

  create(environment: Environment, definition: TestComponentDefinition, args: Arguments): TestComponent {
    return definition.componentFactory.create();
  }

  createComponentDefinition(name: string, template: Template<TemplateMeta>, componentFactory?: Factory<TestComponent>): ComponentDefinition<TestComponent> {
    return new TestComponentDefinition(name, this, template, componentFactory);
  }

  prepareArgs(definition: ComponentDefinition<TestComponent>, args: Arguments): null {
    return null;
  }

  layoutFor(definition: TestComponentDefinition, component: TestComponent, env: Environment): CompiledDynamicProgram {
    let template = definition.template;
    let compiledLayout = template.asLayout().compileDynamic(this.env);

    return compiledLayout;
  }

  getSelf(component: TestComponent) {
    return new UpdatableReference(component);
  }

  didCreateElement(component: TestComponent, element: Element) {
    component.element = element;
  }

  didRenderLayout(component: TestComponent, bounds: Bounds) {
  }

  didCreate(component: TestComponent) {
  }

  getTag() {
    return null;
  }

  update(component: TestComponent, scope: DynamicScope) {
  }

  didUpdateLayout() {}

  didUpdate() {}

  getDestructor() {
    return null;
  }
}