import { createTemplate, setComponentTemplate, templateOnlyComponent } from '@glimmer/core';
import RehydratingComponent from './RehydratingComponent';

const StaticComponent = setComponentTemplate(
  createTemplate(
    { RehydratingComponent },
    `<div class="static-component">
      <h1>Hello I am a static component. I don't change after page load.</h1>
      <RehydratingComponent/>
     </div>
    `
  ),
  templateOnlyComponent()
);

export default StaticComponent;
