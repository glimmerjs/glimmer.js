import { Dict } from '@glimmer/interfaces';

export interface TemplateArgs<
  Positional extends unknown[] = unknown[],
  Named extends Dict<unknown> = Dict<unknown>
> {
  named: Named;
  positional: Positional;
}
