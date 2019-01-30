import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | glimmer.js guide example', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function(assert) {
    assert.validateSpeakers = (speakerNames, currentSpeaker) => {
      let items = this.element.querySelectorAll('li');
      assert.equal(items.length, speakerNames.length, 'correct number of entires found');

      for (let i = 0; i < speakerNames.length; i++) {
        assert.dom(items[i]).hasText(speakerNames[i]);
      }

      assert.dom('p').hasText(`Speaking: ${currentSpeaker}`);
    };
  });


  test('renders', async function(assert) {
    await render(hbs`<ConferenceSpeakers />`);

    assert.validateSpeakers(['Tom', 'Yehuda', 'Ed'], 'Tom');
  });

  test('cycles through speakers', async function(assert) {
    await render(hbs`<ConferenceSpeakers />`);

    assert.validateSpeakers(['Tom', 'Yehuda', 'Ed'], 'Tom');

    await click('button');

    assert.validateSpeakers(['Tom', 'Yehuda', 'Ed'], 'Yehuda');

    await click('button');

    assert.validateSpeakers(['Tom', 'Yehuda', 'Ed'], 'Ed');
    assert.dom('button').doesNotExist();
  });
});
