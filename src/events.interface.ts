import { DataQuery } from './classes/data-query.class';
import { Column } from './classes/column.class';
import { CheckedChangedEvent, ValueChangedEvent, FilterShowEvent } from './classes/events';
import { UIAction, UIActionType } from './classes/ui-action.class';
import { CellPosition } from './classes/cell-position.class';

export interface IEvents {

  customCellEvent(e: any): void;

  dataQueryEvent(query: DataQuery): void;

  dataFetchEvent(q: DataQuery): void;

  columnsChangedEvent(): void;

  queryChangedEvent(q: DataQuery): void;

  summariesChangedEvent(c: Column): void;

  valueChangedEvent(e: ValueChangedEvent): void;

  checkedChangedEvent(e: CheckedChangedEvent): void;

  dragEvent(e: UIAction): void;

  dropEvent(e: UIAction): void;

  columnResizeEvent(e: UIAction): void;

  filterShowEvent(e: FilterShowEvent): void;

  selectEvent(cp: CellPosition): void;

  startEditingEvent(cp: CellPosition): void;

  stopEditingEvent(returnFocus: boolean): void;

  headerContextMenuEvent(e: any): void;
}
