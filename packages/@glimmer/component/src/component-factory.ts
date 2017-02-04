import Component, { ComponentOptions } from './component';

export default class ComponentFactory {
  public ComponentClass: any;

  constructor(ComponentClass: any) {
    this.ComponentClass = ComponentClass;
  }
  
  create( options: ComponentOptions ): Component {
    return new this.ComponentClass(options);
  }
}
