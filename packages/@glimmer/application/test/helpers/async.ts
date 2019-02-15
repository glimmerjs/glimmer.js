declare interface Assert {
  rejects(promise: Promise<any>, expected?: any, message?: any): Promise<void>;
}

Object.assign(QUnit.assert.constructor.prototype, {
  async rejects(promise: Promise<any>, expected?: any, message?: string) {
    let actual = undefined;
    let result = false;

    try {
      await promise;
    } catch (err) {
      actual = err;
    }

    if (actual) {
      if (!expected) {
        result = true;
        expected = null;
      } else if (expected instanceof RegExp) {
        result = expected.test(actual.toString());
      } else if (typeof expected === 'function' && actual instanceof expected) {
        result = true;
      }
    }

    QUnit.config.current.pushResult({
      result,
      actual,
      expected,
      message,
    });
  },
});
