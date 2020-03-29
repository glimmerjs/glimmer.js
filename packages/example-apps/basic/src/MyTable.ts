import Component from '@glimmer/component';
import { action, on } from '@glimmer/modifier';
import { tracked } from '@glimmer/tracking';
import { createTemplate, setComponentTemplate } from '@glimmer/core';

import {
  run, runLots, add, update, swapRows, deleteRow,
} from './utils/benchmark-helpers';

import { fn } from './utils/fn-helper';

import TableRow from './TableRow';
import BsButton from './BsButton';


export default class MyTable extends Component {
  @tracked id = 1;
  @tracked data = [];
  @tracked
  selected = undefined;

  @action create() {
    const result = run(this.id);

    this.id = result.id;
    this.data = result.data;
    this.selected  = undefined;
  }

  @action add() {
    this.data = add(this.id, this.data)
  }

  @action update() {
    update(this.data);
  }

  @action runLots() {
    const result = runLots(this.id);

    this.data = result.data;
    this.id = result.id;
    this.selected = undefined;
  }

  @action clear() {
    this.data = [];
    this.selected  = undefined;
  }

  @action swapRows() {
    this.data = swapRows(this.data);
  }

  @action remove(id) {
    const selected = this.data.find(({selected}) => selected === true);
    if (selected) {
      selected.selected = false;
    }
    this.data = deleteRow(this.data, id);
    this.selected = undefined;
  }

  @action select(id) {
    this.selected = id;
    const selected = this.data.find(({selected}) => selected === true);
    if (selected) {
      selected.selected = false;
    }
    this.data.find((item)=>item.id === id).selected = true;
  }
};


setComponentTemplate(MyTable, createTemplate({on, fn, TableRow, BsButton},`
<div class="jumbotron">
  <div class="row">
    <div class="col-md-6">
      <h1>Glimmer v2</h1>
    </div>
    <div class="col-md-6">
      <div class="row">
        <div class="col-sm-6 smallpad">
          <BsButton id="run" {{on 'click' this.create}}>
            Create 1,000 rows
          </BsButton>
        </div>
        <div class="col-sm-6 smallpad">
          <BsButton id="runlots" {{on 'click' this.runLots}}>
            Create 10,000 rows
          </BsButton>
        </div>
        <div class="col-sm-6 smallpad">
          <BsButton id="add" {{on 'click' this.add}}>
            Append 1,000 rows
          </BsButton>
        </div>
        <div class="col-sm-6 smallpad">
          <BsButton id="update" {{on 'click' this.update}}>
            Update every 10th row
          </BsButton>
        </div>
        <div class="col-sm-6 smallpad">
          <BsButton id="clear" {{on 'click' this.clear}}>
            Clear
          </BsButton>
        </div>
        <div class="col-sm-6 smallpad">
          <BsButton id="swaprows" {{on 'click' this.swapRows}}>
            Swap Rows
          </BsButton>
        </div>
      </div>
    </div>
  </div>
</div>


{{#if this.data.length}}
  <table class="table table-hover table-striped test-data">
    <tbody>
      {{#each this.data key="id" as |item|}}
        <TableRow @item={{item}} @onSelect={{fn this.select item.id}} @onRemove={{fn this.remove item.id}} />
      {{/each}}
    </tbody>
  </table>
{{/if}}


<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
`));
