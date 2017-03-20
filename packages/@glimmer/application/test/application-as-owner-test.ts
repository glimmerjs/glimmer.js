import Application from '../src/application';
import { Resolver, getOwner, isSpecifierStringAbsolute } from '@glimmer/di';
import { BlankResolver } from './test-helpers/resolvers';

const { module, test } = QUnit;

module('Application - Owner interface');

test('#identify - uses a resolver to convert a relative specifier to an absolute specifier', function(assert) {
  assert.expect(2);

  class FakeResolver implements Resolver {
    identify(specifier: string, referrer?: string) {
      if (isSpecifierStringAbsolute(specifier)) {
        return specifier;
      }
      assert.equal(specifier, 'component:date-picker', 'FakeResolver#identify was invoked');
      return 'component:/app/components/date-picker';
    }
    retrieve(specifier: string): any {}
  }

  let resolver = new FakeResolver();
  let app = new Application({ rootName: 'app', resolver });
  let specifier = 'component:date-picker';
  assert.equal(app.identify(specifier, 'component:/app/components/form-controls'), 'component:/app/components/date-picker', 'absolute specifier was returned');
});

test('#factoryFor - returns a registered factory', function(assert) {
  class DatePicker {
    static create() { return { foo: 'bar' }; }
  }

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });

  app.registerInstanceInitializer({
    initialize(app) {
      app.register('component:/app/components/date-picker', DatePicker);
    }
  });

  app.initialize();

  let factory = app.factoryFor('component:/app/components/date-picker');
  assert.strictEqual(factory.class, DatePicker, 'expected factory.class was returned');
});

test('#factoryFor - will use a resolver to locate a factory', function(assert) {
  assert.expect(3);

  class DatePicker {
    static create() { return { foo: 'bar' }; }
  }

  class FakeResolver implements Resolver {
    identify(specifier: string, referrer?: string) {
      if (isSpecifierStringAbsolute(specifier)) {
        return specifier;
      }
      assert.equal(specifier, 'component:date-picker', 'FakeResolver#identify was invoked');
      return 'component:/app/components/date-picker';
    }
    retrieve(specifier: string): any {
      assert.equal(specifier, 'component:/app/components/date-picker', 'FakeResolver#identify was invoked');
      return DatePicker;
    }
  }

  let resolver = new FakeResolver();
  let app = new Application({ rootName: 'app', resolver });

  app.initialize();

  let factory = app.factoryFor('component:date-picker');
  assert.strictEqual(factory.class, DatePicker, 'expected factory was returned');
});

test('#factoryFor - will use a resolver to locate a factory, even if one is registered locally', function(assert) {
  assert.expect(3);

  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  class FooBar {
    static create() { return { foo: 'bar' }; }
  }

  class FakeResolver implements Resolver {
    identify(specifier: string, referrer: string) {
      if (isSpecifierStringAbsolute(specifier)) {
        return specifier;
      }
      assert.equal(specifier, 'foo:bar', 'FakeResolver#identify was invoked');
      return 'foo:/app/foos/bar';
    }
    retrieve(id: string): any {
      assert.equal(id, 'foo:/app/foos/bar', 'FakeResolver#identify was invoked');
      return FooBar;
    }
  }

  let resolver = new FakeResolver();

  let app = new Application({ rootName: 'app', resolver });
  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', Foo);
    }
  });

  app.initialize();

  let factory = app.factoryFor('foo:bar');
  assert.strictEqual(factory.class, FooBar, 'factory from resolver was returned');
});

test('#lookup - returns an instance created by the factory', function(assert) {
  assert.expect(3);

  let instance = { foo: 'bar' };

  class FooBar {
    static create(injections) {
      assert.ok(true, 'Factory#create invoked');
      assert.strictEqual(getOwner(injections), app, 'owner is included in injections');
      return instance;
    }
  }

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });
  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', FooBar);
    }
  });

  app.initialize();

  let foobar = app.lookup('foo:/app/foos/bar');
  assert.strictEqual(foobar, instance, 'instance created');
});

test('#lookup - caches looked up instances by default', function(assert) {
  assert.expect(3);

  let createCounter = 0;

  class FooBar {
    static create(): FooBar {
      createCounter++;
      return new FooBar();
    }
  }

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });
  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', FooBar);
    }
  });

  app.initialize();  

  let foo1 = app.lookup('foo:/app/foos/bar');
  assert.equal(createCounter, 1);
  let foo2 = app.lookup('foo:/app/foos/bar');

  assert.equal(createCounter, 1);
  assert.strictEqual(foo1, foo2);
});

test('#lookup - will not cache lookups specified as non-singletons', function(assert) {
  assert.expect(3);

  let createCounter = 0;

  class FooBar {
    static create(): FooBar {
      createCounter++;
      return new FooBar();
    }
  }

  class App extends Application {
  }

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });
  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', FooBar, { singleton: false });
    }
  });

  app.initialize();

  let foo1 = app.lookup('foo:/app/foos/bar');
  assert.equal(createCounter, 1);
  let foo2 = app.lookup('foo:/app/foos/bar');
  assert.equal(createCounter, 2);
  assert.notStrictEqual(foo1, foo2);
});

test('#lookup - returns the factory when registrations specify instantiate: false', function(assert) {
  assert.expect(1);

  let createCounter = 0;

  let factory = {};

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });
  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', factory, { instantiate: false });
    }
  });

  app.initialize();

  let foo1 = app.lookup('foo:/app/foos/bar');
  assert.strictEqual(foo1, factory);
});

test('#lookup - uses the resolver to locate a registration', function(assert) {
  assert.expect(3);

  class Foo {
    static create() { return { foo: 'bar' }; }
  }

  class FakeResolver implements Resolver {
    identify(specifier: string, referrer?: string): string {
      if (isSpecifierStringAbsolute(specifier)) {
        return specifier;
      }
      assert.equal(specifier, 'foo:bar', 'FakeResolver#identify was invoked');
      return 'foo:/app/foos/bar';
    }
    retrieve(specifier: string): any {
      assert.equal(specifier, 'foo:/app/foos/bar', 'FakeResolver#identify was invoked');
      return Foo;
    }
  }

  let resolver = new FakeResolver();
  let app = new Application({ rootName: 'app', resolver });
  app.initialize();

  let foo1 = app.lookup('foo:bar');

  assert.deepEqual(foo1, { foo: 'bar' }, 'expected factory was invoked');
});

test('#lookup - injects references registered by name', function(assert) {
  assert.expect(5);

  let instance = { foo: 'bar' };
  let router = { name: 'router' };

  class FooBar {
    static create(injections) {
      assert.ok(true, 'FooBarFactory#create invoked');
      assert.strictEqual(injections['router'], router, 'expected injections passed to factory');
      instance['router'] = injections['router'];
      return instance;
    }
  }

  class Router {
    static create() {
      assert.ok(true, 'RouterFactory#create invoked');
      return router;
    }
  }

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });

  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', FooBar);
      app.register('router:/app/root/main', Router);
      app.registerInjection('foo:/app/foos/bar', 'router', 'router:/app/root/main');
    }
  });

  app.initialize();

  assert.strictEqual(app.lookup('foo:/app/foos/bar'), instance, 'instance returned');
  assert.strictEqual(instance['router'], router, 'injection has been applied to instance');
});

test('#lookup - injects references registered by type', function(assert) {
  assert.expect(5);

  let instance = { foo: 'bar' };
  let router = { name: 'router' };

  class FooBar {
    static create(injections) {
      assert.ok(true, 'FooBarFactory#create invoked');
      assert.strictEqual(injections['router'], router, 'expected injections passed to factory');
      instance['router'] = injections['router'];
      return instance;
    }
  }

  class Router {
    static create() {
      assert.ok(true, 'RouterFactory#create invoked');
      return router;
    }
  }

  let app = new Application({ rootName: 'app', resolver: new BlankResolver() });

  app.registerInstanceInitializer({
    initialize(app) {
      app.register('foo:/app/foos/bar', FooBar);
      app.register('router:/app/root/main', Router);
      app.registerInjection('foo:/app/foos/bar', 'router', 'router:/app/root/main');
    }
  });

  app.initialize();

  assert.strictEqual(app.lookup('foo:/app/foos/bar'), instance, 'instance returned');
  assert.strictEqual(instance['router'], router, 'injection has been applied to instance');
});
