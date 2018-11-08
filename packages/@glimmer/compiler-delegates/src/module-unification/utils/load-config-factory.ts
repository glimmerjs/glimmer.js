import { ResolverConfiguration } from '@glimmer/resolver';

export interface Config {
  moduleConfiguration?: ResolverConfiguration;
  modulePrefix?: string;
}

export interface ConfigFactory {
  (environment: string): Config;
}

export default function loadConfigFactory(configPath: string): ConfigFactory | null {
  try {
    // tslint:disable-next-line
    return require(configPath);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return null;
    } else {
      throw e;
    }
  }
}
