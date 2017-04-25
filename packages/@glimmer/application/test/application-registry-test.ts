import ApplicationRegistry from '../src/application-registry';
import { Registry } from '@glimmer/di';
import { BlankResolver } from './test-helpers/resolvers';

const { module, test } = QUnit;

module('ApplicationRegistry');

test('#register - registers a factory', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let registry = new Registry();
  let appRegistry = new ApplicationRegistry(registry, new BlankResolver);

  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), undefined, 'factory has not yet been registered');
  appRegistry.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
});

test('#register - can register options together with a factory', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let registry = new Registry();
  let appRegistry = new ApplicationRegistry(registry, new BlankResolver);

  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), undefined, 'factory has not yet been registered');
  appRegistry.register('foo:/app/foos/bar', Foo, { instantiate: false });
  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
  assert.deepEqual(appRegistry.registeredOptions('foo:/app/foos/bar'), { instantiate: false }, 'options have been registered');
});

test('#registration - returns a factory has been registered', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let registry = new Registry();
  let appRegistry = new ApplicationRegistry(registry, new BlankResolver);

  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), undefined, 'factory has not yet been registered');
  appRegistry.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
});

test('#unregister - unregisters a factory', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let registry = new Registry();
  let appRegistry = new ApplicationRegistry(registry, new BlankResolver);

  appRegistry.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), Foo, 'factory has been registered');
  appRegistry.unregister('foo:/app/foos/bar');
  assert.strictEqual(appRegistry.registration('foo:/app/foos/bar'), undefined, 'factory been unregistered');
});

test('#registerOption, #registeredOptions, #registeredOption, #unregisterOption', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let registry = new Registry();
  let appRegistry = new ApplicationRegistry(registry, new BlankResolver);

  appRegistry.register('foo:/app/foos/bar', Foo);
  assert.strictEqual(appRegistry.registeredOptions('foo:/app/foos/bar'), undefined);
  assert.strictEqual(appRegistry.registeredOption('foo:/app/foos/bar', 'singleton'), undefined);

  appRegistry.registerOption('foo:/app/foos/bar', 'singleton', true);
  assert.deepEqual(appRegistry.registeredOptions('foo:/app/foos/bar'), {singleton: true});
  assert.strictEqual(appRegistry.registeredOption('foo:/app/foos/bar', 'singleton'), true);

  appRegistry.unregisterOption('foo:/app/foos/bar', 'singleton');
  assert.deepEqual(appRegistry.registeredOptions('foo:/app/foos/bar'), {});
  assert.strictEqual(appRegistry.registeredOption('foo:/app/foos/bar', 'singleton'), undefined);
});

test('Options registered by full name supercede those registered by type', function(assert) {
  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  let registry = new Registry();
  let appRegistry = new ApplicationRegistry(registry, new BlankResolver);

  appRegistry.register('foo:/app/foos/bar', Foo);

  appRegistry.registerOption('foo', 'singleton', false);
  assert.strictEqual(appRegistry.registeredOption('foo:/app/foos/bar', 'singleton'), false);
  appRegistry.registerOption('foo:/app/foos/bar', 'singleton', true);
  assert.strictEqual(appRegistry.registeredOption('foo:/app/foos/bar', 'singleton'), true);
});
