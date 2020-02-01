import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  createTemplate,
  setComponentTemplate,
  templateOnlyComponent,
  getScope,
} from '@glimmer/core';
import { helper } from '@glimmer/helper';
import OtherComponent from './OtherComponent';
import { on, action } from '@glimmer/modifier';
import LocaleService from './services/LocaleService';

const myHelper = helper(function([name], { greeting }) {
  return `Helper: ${greeting} ${name}`;
});

const isCJK = helper(function(args, hash, { services }) {
  const localeService = services!.locale as LocaleService;
  return (
    localeService.currentLocale === 'zh_CN' ||
    localeService.currentLocale === 'ko_KO' ||
    localeService.currentLocale === 'ja_JP'
  );
});

const TemplateOnlyComponent = templateOnlyComponent();

setComponentTemplate(
  TemplateOnlyComponent,
  createTemplate(`<h1>I am rendered by a template only component: {{@name}}</h1>`)
);

class MyComponent extends Component {
  message = 'hello world';
  @tracked count = 55;

  get currentLocale() {
    return (getScope(this)!.locale as LocaleService).currentLocale;
  }

  @action
  increment() {
    this.count++;
  }
}

setComponentTemplate(
  MyComponent,
  createTemplate(
    { OtherComponent, TemplateOnlyComponent, myHelper, isCJK, on },
    `
      <h1>Hello {{this.message}}</h1> <br/>
      {{myHelper "foo" greeting="Hello"}}
      <p>Current locale: {{this.currentLocale}}</p>
      {{#if (isCJK)}}
        <p>Component is in a CJK locale</p>
      {{else}}
        <p>Component is not in a CJK locale</p>
      {{/if}}

      <OtherComponent @count={{this.count}} /> <br/>
      <button {{on "click" this.increment}}>Increment</button>
      <TemplateOnlyComponent @name="For Glimmer"/>
    `
  )
);

export default MyComponent;
