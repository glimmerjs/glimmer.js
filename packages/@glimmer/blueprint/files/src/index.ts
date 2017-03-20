import App from './main';
import { ComponentManager } from '@glimmer/component';

const app = new App();

app.registerInitializer({
  initialize(registry) {
    registry.register(`component-manager:/${app.rootName}/component-managers/main`, ComponentManager)
  }
});

app.boot();