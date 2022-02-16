import Application from '../app';
import config from '../config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
import { setup } from 'qunit-dom';
import * as QUnit from 'qunit';

setup(QUnit.assert);

setApplication(Application.create(config.APP));

start();
