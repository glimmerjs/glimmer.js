import Component from '@glimmer/component';
import { action, set, computed } from '@ember/object';

export default class ConferenceSpeakers extends Component {
  current = 0;
  speakers = ['Tom', 'Yehuda', 'Ed'];

  @computed('current')
  get currentlySpeaking() {
    return this.speakers[this.current];
  }

  @computed('current')
  get moreSpeakers() {
    return this.speakers.length - 1 > this.current;
  }

  @action
  next() {
    set(this, 'current', this.current + 1);
  }
}
