import { buildApp, TestApplication, AppBuilder } from './app-builder';
import { DEBUG } from '@glimmer/env';

export interface Constructor<T> {
  new (...args: any[]): T;
}

export function renderModule(name: string, renderTest: Constructor<RenderTest>, options?: Object) {
  QUnit.module(name);

  for (let prop in renderTest.prototype) {
    const test = renderTest.prototype[prop];

    if (isTestFunction(test) && shouldRun(test)) {
      if (options) {
        let app = buildApp(options);
        let instance = new renderTest(app);
        QUnit.test(`${prop}`, assert => test.call(instance, assert));
      } else {
        ['runtime-compiler', 'bytecode'].forEach(loader => {
          let app = buildApp({ loader });
          let instance = new renderTest(app);
          QUnit.test(`[${loader}] ${prop}`, assert => test.call(instance, assert));
        });
      }
    }
  }
}

function shouldRun(testFunc: any): boolean {
  if (testFunc['debug'] && !DEBUG) {
    return false;
  }
  return true;
}

function isTestFunction(value: any): value is (this: RenderTest, assert: typeof QUnit.assert) => void {
  return typeof value === 'function' && value.isTest;
}

export interface RenderOptions {
  component: string;
  parent?: Node;
  sibling?: Node;
  data?: Object;
}

export class RenderTest {
  assert =  QUnit.assert;
  constructor(public app: AppBuilder<TestApplication>) {}
  async render(options: RenderOptions) {
    let app = await this.app.boot();
    if (this.app.options.loader === 'bytecode') {
      let { data, component } = options;
      app.renderComponent({
        component,
        data
      });
    } else {
      let { component, parent, sibling } = options;
      app.renderComponent(component, parent, sibling);
    }
  }

  assertHTML(html: string) {
    let fixture =  this.app.rootElement();
    this.assert.equal((fixture as Element).innerHTML, html);
  }
}

function setTestingDescriptor(descriptor: PropertyDescriptor): void {
  let testFunction = descriptor.value as Function;
  descriptor.enumerable = true;
  testFunction['isTest'] = true;
}

export interface TestMeta {
  debug?: boolean;
}

export function test(meta: TestMeta): MethodDecorator;
export function test(
  _target: Object | TestMeta,
  _name?: string,
  descriptor?: PropertyDescriptor
): PropertyDescriptor | void;
export function test(...args: any[]) {
  if (args.length === 1) {
    let meta: TestMeta = args[0];
    return (_target: Object, _name: string, descriptor: PropertyDescriptor) => {
      let testFunction = descriptor.value as Function;
      Object.keys(meta).forEach(key => (testFunction[key] = meta[key]));
      setTestingDescriptor(descriptor);
    };
  }

  let descriptor = args[2];
  setTestingDescriptor(descriptor);
  return descriptor;
}
