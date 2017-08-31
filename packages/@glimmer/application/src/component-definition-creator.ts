import { Template } from '@glimmer/runtime';
import { Factory } from '@glimmer/di';
import { TemplateMeta, Definition } from '@glimmer/component';

interface ComponentDefinitionCreator {
  createComponentDefinition(name: string, template: Template<TemplateMeta>, componentFactory?: Factory<Component>): Definition;
}

export default ComponentDefinitionCreator;
