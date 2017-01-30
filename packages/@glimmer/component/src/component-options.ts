import Component from './component';

export default class ComponentOptions {
  parent: Component;
  hasBlock: boolean;
  // TODO dispatcher: EventDispatcher;
  args: Object = null;
}
