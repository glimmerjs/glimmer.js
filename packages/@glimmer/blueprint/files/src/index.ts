import { setPropertyDidChange } from '@glimmer/tracking';
import App from './main';

const app = new App();
const containerElement = document.getElementById('app');

setPropertyDidChange(() => {
  app.scheduleRerender();
});

app.renderComponent('<%= component %>', containerElement, null);

app.boot();
