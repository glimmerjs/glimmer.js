import Component from './component';
import { ComponentOptions } from './component-options';

export default class ComponentFactory {
  public ComponentClass: any;

  constructor(ComponentClass: any) {
    this.ComponentClass = ComponentClass;
  }
  
  create( options: ComponentOptions ): Component {
    return new this.ComponentClass(options);
  }
}
