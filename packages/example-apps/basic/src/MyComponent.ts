import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  createTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from '@glimmer/core';
import { helper } from './utils/helper-with-services';
import OtherComponent from './OtherComponent';
import { on, action } from '@glimmer/modifier';
import { Owner } from '..';

const myHelper = helper(function ([name], { greeting }) {
  return `Helper: ${greeting} ${name}`;
});

const isCJK = helper(function (_args, _hash, services) {
  const localeService = services.locale as LocaleService;
  return (
    localeService.currentLocale === 'zh_CN' ||
    localeService.currentLocale === 'ko_KO' ||
    localeService.currentLocale === 'ja_JP'
  );

  return true;
});

const TemplateOnlyComponent = setComponentTemplate(
  createTemplate(`<h1>I am rendered by a template only component: {{@name}}</h1>`),
  templateOnlyComponent()
);

class MyComponent extends Component {
  message = 'hello world';
  @tracked count = 55;

  get currentLocale(): string {
    return getOwner<Owner>(this).services.locale.currentLocale;
  }

  @action
  increment(): void {
    this.count++;
  }
}

setComponentTemplate(
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
  ),
  MyComponent
);

export default MyComponent;
