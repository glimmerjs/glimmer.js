import {
  precompile as glimmerPrecompile,
  PrecompileOptions
} from "@glimmer/compiler";
import { 
  SerializedTemplateWithLazyBlock
} from "@glimmer/wire-format";

export function precompile(template: string, options: PrecompileOptions<{}>): SerializedTemplateWithLazyBlock<{}> {
  return JSON.parse(glimmerPrecompile(template, options));
}
