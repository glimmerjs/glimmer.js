import { Factory } from '@glimmer/di';
import { SerializedTemplate } from '@glimmer/wire-format';
import Component from './component';
import ComponentOptions from './component-options';

export interface ComponentFactory<Component> extends Factory<Component> {
  create( options?: ComponentOptions ): Component;
  layoutSpec: SerializedTemplate<Component>;
}
