import Component from '@glimmer/component';
import { setComponentTemplate, createTemplate } from '@glimmer/core';

import logo from './logo.svg';
import './App.css';

export default class App extends Component {
  logo = logo
}

setComponentTemplate(App, createTemplate(`
  <img src={{this.logo}}/>
  Hello, Glimmer!
`));
