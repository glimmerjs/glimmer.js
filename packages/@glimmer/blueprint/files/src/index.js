import { renderComponent } from '@glimmer/core';
import App from './App';

const containerElement = document.getElementById('app');

renderComponent(App, containerElement);
