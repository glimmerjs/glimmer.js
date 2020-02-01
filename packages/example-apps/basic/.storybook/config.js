import { configure } from '@glimmerx/storybook';

configure(require.context('../src', true, /\.stories\.ts$/), module);
