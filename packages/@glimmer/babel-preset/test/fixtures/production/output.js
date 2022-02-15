var _class, _descriptor, _dog, _cat;

import { createTemplateFactory as _createTemplateFactory } from "@glimmer/core";

function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }

import { assert, deprecate } from '@glimmer/debug';
import { tracked } from '@glimmer/tracking';

if (false
/* DEBUG */
) {
  console.log('DEBUG!');
}

(false && assert(true, 'is true'));
(false && !(false) && deprecate('this is deprecated', false, {
  id: 'foo'
}));
let Test = (_class = (_dog = new WeakMap(), _cat = new WeakSet(), class Test {
  constructor() {
    _cat.add(this);

    _initializerDefineProperty(this, "bar", _descriptor, this);

    _dog.set(this, {
      writable: true,
      value: "dog"
    });
  }

}), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "bar", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 123;
  }
})), _class);

function _cat2() {
  return "cat";
}

_createTemplateFactory(
/*
  Hello, world!
*/
{
  "id": null,
  "block": "[[[1,\"Hello, world!\"]],[],false,[]]",
  "moduleName": "(unknown template module)",
  "scope": null,
  "isStrictMode": true
});