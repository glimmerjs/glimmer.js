import { ResolverConfiguration } from '@glimmer/resolver';
import { Config } from './load-config-factory';

const DEFAULT_MODULE_CONFIGURATION = {
  types: {
    application: { definitiveCollection: 'main' },
    component: { definitiveCollection: 'components' },
    'component-test': { unresolvable: true },
    helper: { definitiveCollection: 'components' },
    'helper-test': { unresolvable: true },
    renderer: { definitiveCollection: 'main' },
    template: { definitiveCollection: 'components' }
  },
  collections: {
    main: {
      types: ['application', 'renderer']
    },
    components: {
      group: 'ui',
      types: ['component', 'component-test', 'template', 'helper', 'helper-test'],
      defaultType: 'component',
      privateCollections: ['utils']
    },
    styles: {
      group: 'ui',
      unresolvable: true
    },
    utils: {
      unresolvable: true
    }
  }
};

export default function buildResolverConfig(config: Config, pkgName: string): ResolverConfiguration {
  let moduleConfig = config.moduleConfiguration || DEFAULT_MODULE_CONFIGURATION;

  let rootName = config.modulePrefix || pkgName;
  let name = pkgName || rootName;

  return {
    app: { name, rootName },
    types: moduleConfig.types,
    collections: moduleConfig.collections
  };
}
