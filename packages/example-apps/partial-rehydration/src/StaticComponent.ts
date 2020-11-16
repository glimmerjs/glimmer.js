import { createTemplate, setComponentTemplate, templateOnlyComponent } from '@glimmer/core';
import RehydratableCounter from './RehydratableCounter';

const StaticComponent = setComponentTemplate(
  createTemplate(
    { RehydratableCounter },
    `<div class="static-component">
      <h1>Hello I am a static component. I don't change after page load.</h1>
      <div><RehydratableCounter @message="Hello World" @foo={{@foo}} /></div>
      <div><RehydratableCounter @message="Bye" /></div>
      <div><RehydratableCounter @message="Ciao" /></div>
      <div><RehydratableCounter @message="Adios" /></div>
      <div><RehydratableCounter @message="Hey1" /></div>
      <div><RehydratableCounter @message="Hey2" /></div>
      <div><RehydratableCounter @message="Hey3" /></div>
      <div><RehydratableCounter @message="Hey4" /></div>
      <div><RehydratableCounter @message="Hey5" /></div>
      <div><RehydratableCounter @message="Hey6" /></div>
     </div>
    `
  ),
  templateOnlyComponent()
);

export default StaticComponent;
