import hbs from "@glimmer/inline-precompile";
import { setupRenderingTest, render } from "@glimmer/test-helpers";

const { module, test } = QUnit;

module("Component: Dummy", function(hooks) {
  setupRenderingTest(hooks);

  module("helper:sum", function(hooks) {
    setupRenderingTest(hooks);
    test("sums array", async function(assert) {
      await render(
        hbs`[{{sum 1 2 3 5}}] [{{sum 1 1}}]`
      );

      assert.equal(
        this.containerElement.innerText,
        "[11] [2]",
        'value should be "[11] [2]"'
      );
    });
  });
});