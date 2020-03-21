/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { AxInject } from '../classes/ax-inject.class';

import { CheckedChangedEvent, ValueChangedEvent } from '../classes/events';
import { CellPosition } from '../classes/cell-position.class';
import { EditorShowMode, ColumnType } from '../classes/enums';
import { Column } from '../classes/column.class';
import { GridSettings } from '../classes/grid-settings.class';
import { Selection } from '../classes/selection.class';
import { DataSource } from '../classes/data-source.class';
import { ColumnCollection } from '../classes/column-collection.class';

import { IEvents } from '../events.interface';

import { LayoutsHandler } from './layouts.handler';

export class GridCheckHandler {

  @AxInject('events')
  events: IEvents;

  @AxInject('dataSource')
  dataSource: DataSource;

  @AxInject('settings')
  settings: GridSettings;

  @AxInject('columns')
  columnCollection: ColumnCollection;

  @AxInject('layouts')
  layoutsHandler: LayoutsHandler;

  @AxInject('selection')
  selection: Selection;

  private get cc(): ColumnCollection {
    return this.columnCollection;
  }

  private get columns(): Column[] {
    return this.cc.columns;
  }

  /**
   * Проверка возможности переключения чекбокса (ColumnType.CHECKBOX и
   * ColumnType.BOOLEAN с возможностью изменения)
   * @param  cp Позиция ячейки
   * @return    Можно переключить или нельзя
   */
  public canToggleCheck(cp: CellPosition): boolean {
    if (cp) {
      // Определяем колонку
      const col: Column = this.cc.columnByFieldName(cp.fieldName);
      const canEdit = this.settings.editorShowMode !== EditorShowMode.NONE && col.allowEdit;
      if (col && (col.isCheckbox || (col.isBoolean && canEdit))) {
        return true;
      }
    }
    // Не. Нечего переключать
    return false;
  }

  public setColumnCheck(col: Column, value: boolean) {
    col.setChecked(value);
    this.dataSource.resultRows.forEach(r => r[col.fieldName] = value);
    this.events.checkedChangedEvent(new CheckedChangedEvent('column', null, col.fieldName, value));
    // Всё же непонятно, почему поменялся запрос, если мы чекнули данные..
    // Возможно потому, что нужно обновить всё.
    // Перезагрузить данные, т.к. они обновились. В этом случае нам
    // ленивая загрузка не нужна.
    this.events.queryChangedEvent(this.dataSource.getQuery());
  }

  /**
   * Обновление зависимых галок (чекбоксов) в гриде
   * @param  fieldName Поле чекбокса
   */
  public updateCheckColumns(fieldName: string = null) {
    this.columns.forEach(col => {
      if (col.type === ColumnType.CHECKBOX && (fieldName === null || col.fieldName === fieldName)) {
        let allChecked = true;
        let allNotChecked = true;
        this.dataSource.resultRows.forEach(r => {
          if (r[col.fieldName]) {
            allNotChecked = false;
          } else {
            allChecked = false;
          }
        });
        if (this.dataSource.resultRowCount === 0) {
          // Если ни одной записи нет, то состояние "Выключено"
          allChecked = false;
        }
        col.setChecked((allChecked && allNotChecked || !allChecked && !allNotChecked) ? null : allChecked);
      }
    });
  }

  /**
   * Поиск первой колонки, в которой есть чекбокс.
   * @param  forEdit Поиск только редактируемых полей (dataType = ColumnType.BOOLEAN)
   * @return         Найденная колонка или null, если ничего не найдено
   */
  public firstCheckableField(forEdit: boolean = true): string {

    if (forEdit && this.selection.focusedCell) {
      const col: Column = this.cc.columnByFieldName(this.selection.focusedCell.fieldName);
      if (col && col.type === ColumnType.BOOLEAN) {
        return col.fieldName;
      }
    }

    let res: Column = null;
    this.layoutsHandler.layouts.some(l => {
      res = l.columns.find(col => col.isCheckbox);
      return res ? true : false;
    });
    return res ? res.fieldName : null;
  }

  public firstCheckboxField(): string {
    return this.firstCheckableField(false);
  }

  public isRowChecked(r: any): boolean {
    const f = this.firstCheckboxField();
    return f && r[f];
  }
}
