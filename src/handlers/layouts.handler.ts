/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { AxInject } from '../classes/ax-inject.class';

import { ColumnType, SelectionMode, GridPart } from '../classes/enums';
import { GridLayoutRange, GridLayoutSelection } from '../classes/grid-layout-selection.class';
import { CellPosition } from '../classes/cell-position.class';
import { Column } from '../classes/column.class';
import { ColumnCollection } from '../classes/column-collection.class';
import { GridLayout } from '../classes/grid-layout.class';
import { Selection } from '../classes/selection.class';
import { DataSource } from '../classes/data-source.class';
import { GridSettings } from '../classes/grid-settings.class';

import { IEvents } from '../events.interface';

export class LayoutsHandler {

  @AxInject('settings')
  settings: GridSettings;

  @AxInject('events')
  events: IEvents;

  @AxInject('dataSource')
  dataSource: DataSource;

  @AxInject('selection')
  selection: Selection;

  @AxInject('columns')
  columnCollection: ColumnCollection;

  public readonly layout: GridLayout = new GridLayout(GridPart.CENTER);
  public readonly layoutDrag: GridLayout = new GridLayout(GridPart.DRAG_ITEM);

  public get layouts(): GridLayout[] {
    return [this.layout];
  }

  /**
   * Focused cell position
   */
  public get focusedCell(): CellPosition {
    return this.selection.focusedCell;
  }

  public set focusedCell(cp: CellPosition) {
    this.selection.focusedCell = cp === null ? null : cp.clone();
  }

  public setLayoutsVisibility() {
    //
  }

  /**
   * Gets column by field name
   * @param  f Field name
   * @return   Column if exists
   */
  protected columnByFieldName(f: string): Column {
    return this.columnCollection.columnByFieldName(f);
  }

  /**
   * Изменение выделенной области
   * @param  cp Позиция ячейки
   */
  protected selectionChanged(cp: CellPosition) {
    this.updateLayoutSelections(cp);
    this.events.selectEvent(cp);
  }

  /**
   * Обновление индексов строк в списке выделенных областей
   */
  public updateSelectionIndices() {
    let changed = this.selection.updateSelectionIndices(this.dataSource.model, this.dataSource.resultRows, this.settings.keyField);
    this.updateLayoutSelections();
    if (changed) {
      this.events.selectEvent(null);
    }
  }

  /**
   * Return the column index in the column list by field name
   * @param  fieldName Name of the field to be searched
   * @return           Column index
   */
  protected columnIndex(fieldName: string): number {
    return this.selection.columnIndex(this.layoutColumns, fieldName);
  }

  /**
   * Обновление выделенных областей для дочерних компонентов
   * @param  scrollToCell Прокрутить до указанной ячейки после обновления
   */
  public updateLayoutSelections(scrollToCell: CellPosition = null) {

    const sm = this.settings.selectionMode;
    const sel = this.selection;
    const lSel = this.layout.selection;

    this.layouts.forEach(l => l.selection.clear());

    if (sm === SelectionMode.NONE) {
      return;
    }

    const A = 0;
    const B = A + this.layout.columns.length;
    const C = B;

    for (const range of sel.ranges) {

      if (range.fromCell.rowIndex < 0) {
        return null;
      }

      let fromIndex = this.columnIndex(range.fromCell.fieldName);
      let toIndex = -1;

      if (range.toCell) {
        toIndex = this.columnIndex(range.toCell.fieldName);
      }

      if (toIndex >= 0 && toIndex < fromIndex) {
        const t = toIndex; toIndex = fromIndex; fromIndex = t;
      }

      if (toIndex === -1 && sm !== SelectionMode.ROW && sm !== SelectionMode.ROW_AND_RANGE) {
        range.toCell = range.fromCell;
        toIndex = fromIndex;
      }

      // Центр
      if (fromIndex < B  || toIndex  === -1) {
        let ci = 0;
        let rx = B - A - 1;
        let ry = 0;
        if (toIndex >= 0) {
          ci = fromIndex - A;
          rx = toIndex < B ? toIndex - fromIndex : B - fromIndex - 1;
          ry = range.toCell.rowIndex - range.fromCell.rowIndex;
        }
        const cr = new GridLayoutRange(range.fromCell.rowIndex, ci);
        cr.rangeX = rx;
        cr.rangeY = ry;

        lSel.ranges.push(cr);
      }
    }

    // Focused cell
    if (sel.focusedCell) {
      const ii = this.columnIndex(sel.focusedCell.fieldName);
      if (ii >= A && ii < B) {
        lSel.focusedRowIndex = sel.focusedCell.rowIndex;
        lSel.focusedColumnIndex = ii - A;
      } else {
        lSel.focusedRowIndex = -1;
      }
    } else {
      lSel.focusedRowIndex = -1;
      lSel.focusedColumnIndex = -1;
    }
    return scrollToCell;
  }

  /**
   * Список колонок по лэйаутам
   * @return Список колонок по лэйаутам
   */
  public get layoutColumns(): Column[] {
    const res: Column[] = [];
    this.layouts.forEach(l => l.columns.forEach(c => res.push(c)));
    return res;
  }

  //
  constructor() { }
}
