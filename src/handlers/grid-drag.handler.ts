/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { AxInject } from '../classes/ax-inject.class';

import { ColumnType, SelectionMode, LazyLoadingMode,
         GridPart, EditorShowMode } from '../classes/enums';
import { Column } from '../classes/column.class';
import { ColumnBand } from '../classes/column-band.class';
import { UIAction } from '../classes/ui-action.class';
import { GridSettings } from '../classes/grid-settings.class';
import { DataSource } from '../classes/data-source.class';
import { ColumnCollection } from '../classes/column-collection.class';
import { Selection } from '../classes/selection.class';
import { LayoutsHandler } from './layouts.handler';
import { GridCheckHandler } from './grid-check.handler';

import { IEvents } from '../events.interface';

export class GridDragHandler {

  @AxInject('events')
  events: IEvents;

  @AxInject('layouts')
  layoutsHandler: LayoutsHandler;

  @AxInject('dataSource')
  dataSource: DataSource;

  @AxInject('settings')
  settings: GridSettings;

  @AxInject('columns')
  columnCollection: ColumnCollection;

  @AxInject('selection')
  public selection: Selection;

  @AxInject('check')
  public check: GridCheckHandler;

  protected get columns() {
    return this.columnCollection.columns;
  }

  /**
   * The list of columns' fieldnames which are being dragged.
   */
  public readonly disabledFields: string[] = [];

  // Настройка компонента для визуализации перетаскиваемого заголовка столбца
  setDragItem(e: UIAction) {

    this.disabledFields.splice(0, this.disabledFields.length);

    if (e.target instanceof Column) {
      const newCol = new Column((<Column>e.target).fieldName, e.target.caption, e.targetWidth, ColumnType.STRING, '');
      newCol.allowFilter = true;
      newCol.fixed = GridPart.DRAG_ITEM;
      this.disabledFields.push(newCol.fieldName);
      this.layoutsHandler.layoutDrag.update([newCol], this.settings.widthUnit, this.settings.levelIndent, 300, false);
    } else {
      if (e.target instanceof ColumnBand) {
        // Вознамерились перетащить бэнд
        const band = <ColumnBand>e.target;
        const newCol = new Column('', band.caption, e.targetWidth, ColumnType.STRING, '');
        newCol.fixed = GridPart.DRAG_ITEM;
        // Все колонки окрасятся в серый цвет на время перетаскивания
        band.columns.forEach(c => this.disabledFields.push(c.fieldName));
        this.layoutsHandler.layoutDrag.update([newCol], this.settings.widthUnit, this.settings.levelIndent, 300, false);
      } else {
        // Строка?
        // Первые 4 колонки?
        const dragColumns: any[] = [];
        for (let i = 0; i < this.columns.length; i++) {
          const col = this.columns[i];
          if (!col.visible) {
            continue;
          }
          const dCol = col.clone();
          dCol.fixed = GridPart.DRAG_ITEM;
          dragColumns.push(dCol);

          if (dragColumns.length > 3) {
            break;
          }
        }

        this.layoutsHandler.layoutDrag.update(dragColumns, this.settings.widthUnit, this.settings.levelIndent);

        // Колонки добавлены
        // Теперь строки...
        // 1. Сфокусированная
        if (this.check.isRowChecked(this.selection.focusedRow)) {
          // Берем все выделенные строки
          e.target = [];
          this.dataSource.resultRows.forEach(r => {
            if (this.check.isRowChecked(r) && !r.__ax_isGroup) {
              e.target.push(r);
            }
          });
        } else {
          e.target = [this.selection.focusedRow];
        }
      }
    }
  }

  // Очистка компонента для визуализации перетаскиваемого заголовка столбца
  public clearDragItem() {
    this.disabledFields.splice(0, this.disabledFields.length);
    this.layoutsHandler.layoutDrag.update([]);
  }

  // Один из дочерних компонентов говорит нам, что что-то тащится.
  // Передаем заинтересованным слушателям
  public drag(e: UIAction) {
    this.events.dragEvent(e);
  }

  // Один из дочерних компонентов говорит нам, что что-то брошено.
  // Передаем заинтересованным слушателям
  public drop(e: UIAction) {
    this.events.dropEvent(e);
  }

  constructor() { }
}
