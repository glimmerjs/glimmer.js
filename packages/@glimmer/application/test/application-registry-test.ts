import Application from '../src/application';
import { Resolver, getOwner } from '@glimmer/di';

const { module, test } = QUnit;

module('Application - Registry interface');

test('#register - registers a factory', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app' });

  assert.strictEqual(app.registration('foo:/app/foos/bar'), undefined, 'factory has not yet been registered');
  app.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(app.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
});

test('#register - can register options together with a factory', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app' });

  assert.strictEqual(app.registration('foo:/app/foos/bar'), undefined, 'factory has not yet been registered');
  app.register('foo:/app/foos/bar', Foo, { instantiate: false });
  assert.strictEqual(app.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
  assert.deepEqual(app.registeredOptions('foo:/app/foos/bar'), { instantiate: false }, 'options have been registered');
});

test('#registration - returns a factory has been registered', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app' });

  assert.strictEqual(app.registration('foo:/app/foos/bar'), undefined, 'factory has not yet been registered');
  app.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(app.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
});

test('#unregister - unregisters a factory', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app' });

  app.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(app.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
  app.unregister('foo:/app/foos/bar');
  assert.strictEqual(app.registration('foo:/app/foos/bar'), undefined, 'factory been unregistered');
});

test('#registerOption, #registeredOptions, #registeredOption, #unregisterOption', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app' });

  app.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(app.registeredOptions('foo:/app/foos/bar'), undefined);
  assert.strictEqual(app.registeredOption('foo:/app/foos/bar', 'singleton'), undefined);

  app.registerOption('foo:/app/foos/bar', 'singleton', true);
  assert.deepEqual(app.registeredOptions('foo:/app/foos/bar'), {singleton: true});
  assert.strictEqual(app.registeredOption('foo:/app/foos/bar', 'singleton'), true);

  app.unregisterOption('foo:/app/foos/bar', 'singleton');
  assert.deepEqual(app.registeredOptions('foo:/app/foos/bar'), {});
  assert.strictEqual(app.registeredOption('foo:/app/foos/bar', 'singleton'), undefined);
});

test('Options registered by full name supercede those registered by type', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app' });

  app.register('foo:/app/foos/bar', Foo);

  app.registerOption('foo', 'singleton', false);
  assert.strictEqual(app.registeredOption('foo:/app/foos/bar', 'singleton'), false);
  app.registerOption('foo:/app/foos/bar', 'singleton', true);
  assert.strictEqual(app.registeredOption('foo:/app/foos/bar', 'singleton'), true);
});
