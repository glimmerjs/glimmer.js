import {
  precompile as glimmerPrecompile,
  PrecompileOptions
} from "@glimmer/compiler";
import { 
  TemplateJavascript 
} from "@glimmer/wire-format";

export function precompile(template: string, options: PrecompileOptions): TemplateJavascript {
  return JSON.parse(glimmerPrecompile(template, options));
}
