import Component from '@glimmer/component';
import { on } from '@glimmer/modifier';
import { createTemplate, setComponentTemplate } from '@glimmer/core';

export default class TableRow extends Component {};

setComponentTemplate(TableRow, createTemplate({on}, `<tr class={{if @item.selected "danger"}}>
<td class="col-md-1">{{@item.id}}</td>
<td class="col-md-4"><a {{on 'click' @onSelect}}>{{@item.label}}</a></td>
<td class="col-md-1"><a {{on 'click' @onRemove}}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
<td class="col-md-6"></td>
</tr>`));