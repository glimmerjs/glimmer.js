import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { createTemplate, setComponentTemplate } from '@glimmer/core';
import { on, action } from '@glimmer/modifier';
import RehydratableRegion from './RehydratableRegion';

class RehydratableCounter extends Component {
  @tracked count = 1;

  @action increment(): void {
    this.count++;
  }
}

setComponentTemplate(
  createTemplate(
    { on, RehydratableRegion },
    `<RehydratableRegion @name="RehydratableCounter" @data={{this.args}}>
      <h1>{{@message}}</h1>
      <p>{{@foo.bar}}</p>
      <p>You have clicked the button {{this.count}} times.</p>
      <button {{on "click" this.increment}}>Click</button>
     </RehydratableRegion>
    `
  ),
  RehydratableCounter
);

export default RehydratableCounter;
