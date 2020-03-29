import { helper } from './helper-with-services';


export function fn([method, ...args]) {
  return  (...params)  => {
      let el = [].concat(args, params);
      return method(...el);
  }
};
