import Component from './component';

export interface ComponentOptions {
  parent?: Component;
  hasBlock?: boolean;
  // TODO dispatcher: EventDispatcher;
  args?: Object;
}
