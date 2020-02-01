import { storiesOf } from '@glimmerx/storybook';
import OtherComponent from './OtherComponent';
import { hbs } from '@glimmerx/component';

storiesOf('Example Stories', module)
.add('OtherComponent', () => hbs`<OtherComponent @count=101/>`)
.add('OtherComponent with context data', () => ({
  componentClass: OtherComponent,
  componentArgs: {
    count: 1007
  }
}));
