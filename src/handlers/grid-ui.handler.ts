/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { AxInject } from '../classes/ax-inject.class';

import { Keys } from '../common/keys.class';
import { Utils } from '../common/utils.class';
import { Column } from '../classes/column.class';
import { ColumnType, EditorShowMode, SelectionMode } from '../classes/enums';
import { UIAction, UIActionType } from '../classes/ui-action.class';
import { CellPosition } from '../classes/cell-position.class';
import { ValueChangedEvent, CheckedChangedEvent } from '../classes/events';
import { Selection } from '../classes/selection.class';
import { DataSource } from '../classes/data-source.class';
import { GridSettings } from '../classes/grid-settings.class';
import { ColumnCollection } from '../classes/column-collection.class';

import { GridCheckHandler } from './grid-check.handler';
import { LayoutsHandler } from './layouts.handler';

import { IEvents } from '../events.interface';

export class GridUIHandler {

  @AxInject('layouts')
  public layoutsHandler: LayoutsHandler;

  @AxInject('events')
  public events: IEvents;

  @AxInject('settings')
  public settings: GridSettings;

  @AxInject('selection')
  public selection: Selection;

  @AxInject('dataSource')
  dataSource: DataSource;

  @AxInject('check')
  public check: GridCheckHandler;

  @AxInject('columns')
  columnCollection: ColumnCollection;

  private get cc(): ColumnCollection {
    return this.columnCollection;
  }

  private get columns(): Column[] {
    return this.cc.columns;
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

  public cellPosition(row: any, rowIndex: number, fieldName: string) {
    return this.selection.cellPosition(row, rowIndex, fieldName, this.settings.keyField);
  }

  /**
   * Previous position of the focused cell
   */
  private _prevFocused: CellPosition = null;

  /**
   * Position of the cell containing an editor
   */
  private _editor: CellPosition = null;

  public get editor() {
    return this._editor;
  }

  /**
   * Значение редактора. Storing value here because cell may be not rendered.
   */
  public editorValue: any = null;

  /**
   * Cell value before editing
   */
  public editorValueChanged = false;

  /**
   * If the editor has been shown. This flag is necessary for understanding
   * if the dropdown list has been shown avoid more showing
   * (during the scrolling the editor may be initialized several times).
   */
  public editorWasShown = false;

  /**
   * Editor's height. We need to remember it because cell containing editor can
   * affect the height of the row. Without storing this value the row's height will
   * be lost.
   */
  public editorHeight: number = null;

  /**
   * Проверка возможности редактирования заданной ячейки
   * @param  cp Позиция ячейки
   * @return    Можно ли редактировать
   */
  // В источник данных? - зависит от настроек. Давайте в колонку
  /*
  protected canEditColumnCell(cp: CellPosition): boolean {
    if (cp) {
      const col: Column = this.columnByFieldName(cp.fieldName);
      return col.isCheckbox ? false : this.settings.canEditColumnCell(col);
    }
    return false;
  }
  */

  /**
   * Проверка видимости строки после изменения значения одного из полей
   * @param  r         Измененная строка
   * @param  fieldName Наименование поля
   * @return           Необходим ли перезапрос данных
   */
  protected checkDataUpdateNeed(r: any, fieldName: string): boolean {
    if (this.dataSource.checkDataUpdateNeed(r, fieldName)) {
      this.events.queryChangedEvent(this.dataSource.getQuery());
      return true;
    }
    return false;
  }

  /**
   * Handling of the pressed key before editor Initialization.
   * This may happen with quick user typing.
   */
  public processKeyBeforeEdit(keyEvent: any) {
    const keyChar = Keys.keyChar(keyEvent);
    if (this._editor !== null && keyChar.length === 1) {
      // Initialization of the editor is started.
      // Apply key.
      if (!this.editorValueChanged) {
        this.editorValue = keyChar;
        this.editorValueChanged = true;
      } else {
        this.editorValue += keyChar;
      }
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
    }
  }

  /**
   * Editor Initialization.
   * @param  cp            Cell position
   * @param  returnFocus   Set this parameter true if it is necessary to return the focus into the grid.
   * @param  keyEvent      The key that runs cell into the edit mode.
   * @param  cancelCurrent Set this parameter true to reject the changes of the previous editing.
   */
  public setEditor(cp: CellPosition, returnFocus: boolean = false, keyEvent: any = null, cancelCurrent: boolean = false) {

    if (this._editor === null && cp === null) {
      return;
    }

    // There is no editor or previous editor is equal to the currrent one.
    if (this._editor === null || !this._editor.equals(cp)) {

      const v0 = this.editorValue; //  Previous value
      const ed0 = this._editor;
      this._editor = cp === null ? null : cp.clone();
      this.editorHeight = null;

      // Current value
      let v: any = null;
      if (cp !== null) {
        v = cp.row[cp.fieldName];
        const col = this.cc.columnByFieldName(cp.fieldName);
        if (col.type === ColumnType.STRING) {
          v = v === null ? '' : Utils.htmlToPlaintext(v);
        }
      }
      this.editorWasShown = false;
      this.editorValueChanged = false;
      this.editorValue = v;
      this.processKeyBeforeEdit(keyEvent);

      if (ed0 !== null && this._editor === null) {
        // Save value of the current editor.
        if (this.settings.editorAutoCommit && !cancelCurrent) {
          this.commitEditor(ed0.row, ed0.fieldName, v0);
        }
        this.events.stopEditingEvent(returnFocus);
      } else {
        // Send notification about the new editor.
        if (this._editor !== null) {
          this.events.startEditingEvent(this._editor);
        }
      }
    }
  }

  // Пользователь начинает выделять ячейки - MouseDown
  public startAction(cp: CellPosition, ctrl: boolean = false, byTouch: boolean = false, button: number = 0): UIActionType {

    if (this.focusedCell != null &&
        this.focusedCell.equals(cp) &&
        this.settings.editorShowMode === EditorShowMode.ON_CLICK_FOCUSED &&
        byTouch
     ) {
      // Только для touch делаем это при начале выделения.
      this.startEditing(cp);
      return null;
    }

    if (!cp || cp.fieldName === '') {
      // Не попали в ячейку
      return null;
    }

    if (button === 2 && this.selection.isSelected(this.layoutsHandler.layoutColumns, cp, this.settings)) {
      // Контекстное меню лучше вызовем
      this.selection.focusedCell = cp; // событие по изменению фокуса должно вызваться
      return null;
    }

    // Сохраняем текущий фокус
    this._prevFocused = this.focusedCell === null ? null : this.focusedCell.clone();
    this.startSelect(cp, ctrl && this.settings.multiSelect);
    return UIActionType.SELECT;
  }

  /**
   * Start selecting cells
   * @param  cp   Cell position
   * @param  add
   */
  public startSelect(cp: CellPosition, add: boolean = false) {
    this.selection.startSelect(cp, add);
  }

  // Пользователь продолжает выделять ячейки (MouseMove)
  public proceedToSelect(cp: CellPosition): boolean {
    if (this.settings.editorShowMode === EditorShowMode.ON_MOUSE_DOWN) {
      // Включен редактор, не расширяем из него выделение
      if (this.editor && this.editor.equals(this.focusedCell)) {
        return false;
      }
    }
    // Продолжить выделение можно только в некоторых режимах при
    // отсутствии настройки перетаскивания строки
    if (this.settings.rowDrag) {
      return false;
    }

    if (this.settings.selectionMode !== SelectionMode.RANGE &&
       this.settings.selectionMode !== SelectionMode.ROW_AND_RANGE) {
       return false;
     }
    // Можно..
    if (this.selection.proceedToSelect(cp)) {
      return true;
    }
    return false;
  }


  /**
   * The user has finished selecting the cells (MouseUp)
   * @param  cp      Cell RowPosition
   * @param  byTouch Selection took place in touch events
   * @param  button  Левая или правая кнопка мыши
   */
  public endSelect(cp: CellPosition, byTouch: boolean = false, button: number = 0) {

    // Check duplicates
    this.selection.endSelect(this.settings.selectionMode);

    // Commit the changes, start editing if necessary
    if (this.selection.focusedCell !== null) {
      if (this.settings.editorShowMode === EditorShowMode.ON_FOCUS &&
          this.selection.isSingleCellSelected() &&
          button === 0) {
        this.startEditing(cp);
        return;
      }
      if (this.settings.editorShowMode === EditorShowMode.ON_CLICK_FOCUSED &&
         this.focusedCell.equals(this._prevFocused) &&
         this.focusedCell.equals(cp) &&
         button === 0 &&
         !byTouch
       ) {
        this.startEditing(cp);
        return;
      }
    }
  }

  /**
   * Обработка события mousedown. Возможно, необходимо включить редактор
   * @param  cp          Позиция
   * @return             Если true, то событие обработано, дальнейшая обработка не требуется
   */
  public mouseDown(cp: CellPosition, touch: boolean = false, button: number = 0): boolean {

    // Если планируется переключение чекбокса, то выходим из процедуры
    if (this.settings.checkByCellClick && this.check.canToggleCheck(cp)) {
      // Не начинаем выделение
      return true;
    }

    // Включение редактора при EditorShowMode.ON_MOUSE_DOWN
    if (this.settings.editorShowMode === EditorShowMode.ON_MOUSE_DOWN && this.editor === null) {
      this.selection.focusedCell = null;
      this.selection.startSelect(cp, false);
      return true;
    }

    return false;
  }

  // Пользователь переключает галку в группе или строке
  public toggleCheck(row: any, fieldName: string, v: boolean = undefined) {
    const col: Column = this.cc.columnByFieldName(fieldName);
    if (col && col.type !== ColumnType.CHECKBOX) {
      this.commitEditor(row, fieldName, !row[fieldName]);
      return;
    }

    if (v !== undefined) {
      if (row[fieldName] !== v) {
        row[fieldName] = v;
        this.check.updateCheckColumns(fieldName);
        // Сигнализируем о том, что нужно проверить изменения
        this.events.valueChangedEvent(new ValueChangedEvent(row, fieldName));
        this.events.checkedChangedEvent(new CheckedChangedEvent('row', row, fieldName, v));
      }
    } else {
      row[fieldName] = !row[fieldName];
      this.check.updateCheckColumns(fieldName);
      // Сигнализируем о том, что нужно проверить изменения
      this.events.valueChangedEvent(new ValueChangedEvent(row, fieldName));
      this.events.checkedChangedEvent(new CheckedChangedEvent('row', row, fieldName, row[fieldName]));
    }
  }

  /**
   * Пользователь переключает галку в заголовке столбца
   * @param  col Колонка с чекбоксом
   */
  public toggleCheckColumn(col: Column) {
    let newValue = true;
    if (col.isChecked || col.isChecked === null) {
      newValue = false;
    }
    this.check.setColumnCheck(col, newValue);
  }

  /**
   * Click event handling. Toggle cell checkbox.
   * @param  cp         Cell position
   * @return            Has event been handled
   */
  public click(cp: CellPosition): boolean {
    if (this.settings.checkByCellClick && this.check.canToggleCheck(cp)) {
      this.toggleCheck(cp.row, cp.fieldName);
      return true;
    }
    return false;
  }

  /**
   * Отработка события DblClick. Включение редкатора по EditorShowMode.ON_DBL_CLICK
   * @param  e Параметры события
   * @param  r Строка, по которой был даблклик
   */
  public dblClick(e: any, r: any) {
    if (this.selection.isSingleCellSelected()) {
      if (this.settings.editorShowMode === EditorShowMode.ON_DBL_CLICK) {
        this.startEditing(this.focusedCell);
      }
    }
  }

  // Начало редактирования
  public startEditing(cp: CellPosition, keyEvent: any = null): boolean {
    if (this.dataSource.canEditCell(cp)) {
      this.setEditor(cp.clone(), false, keyEvent);
      return true;
    }
    return false;
  }

  // Окончание редактирования
  public stopEditing(cp: CellPosition, returnFocus: boolean = false, cancelChanges: boolean = false) {
    if (cp !== null && cp.equals(this.editor)) {
      this.setEditor(null, returnFocus, '', cancelChanges);
    }
  }

  /**
   * Подтверждение нового значения ячейки после редактирования
   * @param  row       Строка
   * @param  fieldName Наименвание поля
   * @param  value     Новое значение
   * @return           Изменено ли в итоге значение
   */
  public commitEditor(row: any, fieldName: string, value: any): boolean {

    // Останавливаем редактор
    this.stopEditing(this.editor, true);

    // Значение не изменилось
    if (this.dataSource.value(row, fieldName) === value) {
      return false;
    }

    // Индекс строки здесь не важен
    if (this.dataSource.canEditCell(this.cellPosition(row, -1, fieldName))) {
      const rowData = this.dataSource.updateValue(row, fieldName, value);
      this.checkDataUpdateNeed(rowData, fieldName);
      this.events.valueChangedEvent(new ValueChangedEvent(rowData, fieldName));
      return true;
    }
    return false;
  }

  // Обработка нажатия клавиши
  public processKey(
    pageCapacity: { upRowCount: number, downRowCount: number },  // Емкость предыдущей и следующей страниц
    keyEvent: any
  ): boolean {
    // При нажатии ENTER или символьной клавиши - включаем редактор
    if ((keyEvent.keyCode === Keys.ENTER || Keys.keyChar(keyEvent).length === 1)
        && this.dataSource.canEditCell(this.focusedCell)
        && this.settings.editorByKey) {
      if (this.startEditing(this.focusedCell, keyEvent)) {
        // Обработали
        return true;
      }
    }

    // Дальше, всё, что мы еще можем обработать - это работа с выделенными областями
    const res = this.selection.move(this.layoutsHandler.layouts, this.settings, this.dataSource.resultRows, pageCapacity, keyEvent);

    if (res !== null) {
      return true;
    }

    // Всё-таки, клавиша не пригодилась
    return false;
  }
}
