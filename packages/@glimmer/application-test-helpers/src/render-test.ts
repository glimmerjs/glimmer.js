import { buildApp, TestApplication, AppBuilder } from './app-builder';
import { DEBUG } from '@glimmer/env';

export interface Constructor<T> {
  new (...args: any[]): T;
}

export function renderModule(name: string, renderTest: Constructor<RenderTest>) {
  QUnit.module(name);

  for (let prop in renderTest.prototype) {
    const test = renderTest.prototype[prop];

    if (isTestFunction(test) && shouldRun(test)) {
      ['runtime-compiler', 'bytecode'].forEach(loader => {
        let app = buildApp({ loader });
        QUnit.test(`[${loader}] ${prop}`, assert => test.call({ app }, assert));
      });
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

export class RenderTest {
  app: AppBuilder<TestApplication>;
}

function setTestingDescriptor(descriptor: PropertyDescriptor): void {
  let testFunction:TestFunction = descriptor.value as TestFunction;
  descriptor.enumerable = true;
  testFunction['isTest'] = true;
}

export interface TestMeta {
  [key: string]: any;
  debug?: boolean;
}

export interface TestFunction {
  [key: string]: boolean;
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
      let testFunction: TestFunction = descriptor.value as TestFunction;
      Object.keys(meta).forEach(key => (testFunction[key] = meta[key]));
      setTestingDescriptor(descriptor);
    };
  }

  let descriptor = args[2];
  setTestingDescriptor(descriptor);
  return descriptor;
}
