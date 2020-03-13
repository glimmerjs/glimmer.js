import { Dict } from '@glimmer/interfaces';

export interface Args<
  Positional extends unknown[] = unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
> {
  named: Named;
  positional: Positional;
}
