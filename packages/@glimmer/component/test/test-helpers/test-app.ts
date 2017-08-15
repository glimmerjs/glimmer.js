import Application from '@glimmer/application';
import { Simple } from '@glimmer/interfaces';
import { AppBuilder, AppBuilderOptions } from '@glimmer/application-test-helpers';
import { ComponentManager } from '../..';

export interface TestElement extends Simple.Element {
  textContent: string;
}

export class TestApplication extends Application {
  rootElement: TestElement;
}

export default function buildApp(appName = 'test-app', options: AppBuilderOptions = {}): AppBuilder {
  options.ApplicationClass = options.ApplicationClass || TestApplication;
  options.ComponentManager = options.ComponentManager || ComponentManager;
  return new AppBuilder(appName, options);
}
