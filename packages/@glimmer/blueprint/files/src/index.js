import { renderComponent } from '@glimmer/core';
import Main from './main';

const containerElement = document.getElementById('app');

renderComponent(Main, containerElement);
