import { readFileSync } from 'fs';
import { Dict } from '@glimmer/util';

export interface PackageJSON {
  name: string;
  version: string;

  [key: string]: string | number | Array<string | number> | Dict<string | number> | undefined;
}

export default function loadPackageJSON(pkgPath: string): PackageJSON {
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8').toString());
  } catch (e) {
    let err = Error(`Couldn't load package.json file at ${pkgPath}: ${e.message}`);
    err.stack = e.stack;
    throw err;
  }
}
