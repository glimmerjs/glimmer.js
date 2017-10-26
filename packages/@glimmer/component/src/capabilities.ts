import { ComponentCapabilities } from "@glimmer/interfaces";

export const CAPABILITIES: ComponentCapabilities = {
  dynamicLayout: false,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: true,
  attributeHook: true,
  elementHook: true
};
