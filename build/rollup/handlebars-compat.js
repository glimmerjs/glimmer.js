module.exports = function() {
  return {
    name: "handlebars-resolver",
    load(id) {
      if (id.match(/node_modules[/\\]handlebars[/\\]lib[/\\]handlebars.js/)) {
        return `
          import { parse } from "./handlebars/compiler/base";
          export { parse as parse };
        `;
      }

      return null;
    }
  };
};
