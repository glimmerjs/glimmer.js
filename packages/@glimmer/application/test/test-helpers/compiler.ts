import {
  precompile as glimmerPrecompile,
  PrecompileOptions
} from "@glimmer/compiler";
import { 
  SerializedTemplateWithLazyBlock
} from "@glimmer/wire-format";
import { TemplateMeta } from '@glimmer/component';

export function precompile(template: string, options: PrecompileOptions<TemplateMeta>): SerializedTemplateWithLazyBlock<TemplateMeta> {
  return JSON.parse(glimmerPrecompile(template, options));
}
