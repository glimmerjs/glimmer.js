import { helper } from './helper-with-services';


export const fn = helper(function([method, ...args]) {
  return  (...params)  => {
      let el = [].concat(args, params);
      return method(...el);
  }
});