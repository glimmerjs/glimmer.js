import Component from '@glimmer/component';
import { setComponentTemplate, precompileTemplate } from '@glimmer/core';

import logo from './logo.svg';
import './App.css';

export default class App extends Component {
  logo = logo;
}

setComponentTemplate(
  precompileTemplate(
    `
    <div id="intro">
      <img src={{this.logo}} alt="" />

      <h1>hello, glimmer!</h1>
      <p>
        you can get started by editing <code>src/App.js</code>,
        and run tests by visiting <a href="./tests">/tests</a>
      </p>
    </div>
  `,
    { strictMode: true }
  ),
  App
);
