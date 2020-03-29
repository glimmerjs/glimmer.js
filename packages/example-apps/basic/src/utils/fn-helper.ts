import { helper } from './helper-with-services';


export const fn = helper(function([method, ...args]) {
  return  (...params): []  => {
      const el = [].concat(args, params);
      return method(...el);
  }
});