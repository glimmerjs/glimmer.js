# @glimmer/blueprint

[![npm version](https://badge.fury.io/js/%40glimmer%2Fblueprint.svg)](https://badge.fury.io/js/%40glimmer%2Fblueprint)

This repository holds the blueprint for generating a new Glimmer project.

It is to be used, currently, with Ember CLI Canary, which you have to install from the [`master` branch](https://github.com/ember-cli/ember-cli).
The project generated follows the [Module Unification RFC](https://github.com/emberjs/rfcs/blob/master/text/0143-module-unification.md) that is soon to be adopted by Ember,
and thus shared by both projects.

To learn more about making blueprints, consult [the blprnt repository](https://github.com/ember-cli/blprnt).

To generate a project using this blueprint, install Ember CLI Canary (`npm install -g ember-cli/ember-cli`), and do:

```bash
ember new hello-glimmer -b @glimmer/blueprint
```
