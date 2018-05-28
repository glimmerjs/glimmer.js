import { ComponentCapabilities } from "@glimmer/interfaces";

export const CAPABILITIES: ComponentCapabilities = {
  attributeHook: true,
  createArgs: true,
  createCaller: false,
  createInstance: true,
  dynamicLayout: false,
  dynamicScope: false,
  dynamicTag: true,
  elementHook: true,
  prepareArgs: false,
  updateHook: true,
};
