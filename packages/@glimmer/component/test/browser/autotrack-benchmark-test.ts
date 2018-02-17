import Component, { tracked } from '@glimmer/component';
import { buildApp, didRender } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] autotrack benchmark lol');

test('autotrack benchmark lol', async function(assert) {
  class Node {
    @tracked left: Node;
    @tracked right: Node;
    @tracked value: number;

    constructor(currentDepth) {
      this.left = currentDepth > 0 ? new Node(currentDepth - 1) : null;
      this.right = currentDepth > 0 ? new Node(currentDepth - 1) : null;
      this.value = 0;
    }

    // @tracked('left', 'right', 'value') get sum() {
    @tracked get sum() {
      let sum = this.value;
      if (this.left) sum += this.left.sum;
      if (this.right) sum += this.right.sum;
      return sum;
    }
  }

  let height = 0;
  let root;
  let startTime;

  let results = {};

  class Benchmark extends Component {
    @tracked root;

    constructor(injections: any) {
      super(injections);

      this.root = root = new Node(height);

      startTime = performance.now();
    }

    didInsertElement() {
      results[`2^${height} nodes`] = {};
      results[`2^${height} nodes`]['initial (ms)'] = performance.now() - startTime;
    }

    didUpdate() {
      results[`2^${height} nodes`]['update (ms)'] = performance.now() - startTime;
    }
  }

  for (let i = 0; i < 19; i++) {
    let app = await buildApp({ appName: 'test-app' })
      .template('Main', '<Benchmark></Benchmark>')
      .template('Benchmark', '<div id="sum">{{this.root.sum}}</div>')
      .component('Benchmark', Benchmark)
      .boot();

    assert.equal(app.rootElement.textContent, '0');

    // Change just the left most node and schedule a rerender.
    let left = root;
    while (left.left) left = left.left;

    startTime = performance.now();
    left.value = 1;
    await app.scheduleRerender();

    assert.equal(app.rootElement.textContent, '1');


    height++;
  }

  console.table(results);

  assert.ok(true);
});
