import { TemplateMeta } from '@glimmer/wire-format';

interface ExtendedTemplateMeta extends TemplateMeta {
  specifier: string;
}

export default ExtendedTemplateMeta;