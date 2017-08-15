import { Template, Component, ComponentDefinition } from '@glimmer/runtime';
import { Factory } from '@glimmer/di';
import { TemplateMeta } from '@glimmer/component';

interface ComponentDefinitionCreator {
  createComponentDefinition(name: string, template: Template<TemplateMeta>, componentFactory?: Factory<Component>): ComponentDefinition<Component>;
}

export default ComponentDefinitionCreator;
