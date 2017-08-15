import Application from '../../src/index';
import { Element } from 'simple-dom';
import { AppBuilder, AppBuilderOptions } from '@glimmer/application-test-helpers';
import { ComponentManager } from '@glimmer/component';

export class TestApplication extends Application {
  rootElement: Element;
}

export default function buildApp(appName = 'test-app', options: AppBuilderOptions = {}) {
  options.ApplicationClass = options.ApplicationClass || TestApplication;
  options.ComponentManager = options.ComponentManager || ComponentManager;
  return new AppBuilder(appName, options);
}
