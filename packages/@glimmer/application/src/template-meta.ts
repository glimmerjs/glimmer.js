import { TemplateMeta } from '@glimmer/wire-format';

interface ExtendedTemplateMeta extends TemplateMeta {
  specifier: string;
  managerId?: string;
}

export default ExtendedTemplateMeta;