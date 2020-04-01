/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { SelectionMode, LazyLoadingMode,
         GridPart, EditorShowMode } from './classes/enums';

import { FilterShowEvent } from './classes/events';

import { DataSource } from './classes/data-source.class';

import { Summary, SummaryType } from './classes/summary.class';
import { SortInfo, SortType } from './classes/sort-info.class';
import { PageInfo } from './classes/page-info.class';

import { Column } from './classes/column.class';
import { ColumnBand } from './classes/column-band.class';
import { ColumnCollection } from './classes/column-collection.class';
import { Filter } from './classes/filter.class';
import { DataQuery } from './classes/data-query.class';

import { CellPosition } from './classes/cell-position.class';
import { Selection } from './classes/selection.class';

import { GridAppearance } from './classes/grid-appearance.class';
import { GridLayout } from './classes/grid-layout.class';
import { GridExporter } from './classes/grid-exporter.class';

import { Utils } from './common/utils.class';

import { AxInject } from './classes/ax-inject.class';
import { AxInjectConsumer } from './classes/ax-inject-consumer.class';

import { GridSettings } from './classes/grid-settings.class';
import { GridUIHandler } from './handlers/grid-ui.handler';
import { GridCheckHandler } from './handlers/grid-check.handler';
import { GridDragHandler } from './handlers/grid-drag.handler';
import { GridLazyLoadHandler } from './handlers/grid-lazy-load.handler';
import { LayoutsHandler } from './handlers/layouts.handler';

import { IEvents } from './events.interface';

/**
 * Grid's state. Contains:
 * - grid's settings
 * - provided column's list
 * - column's lists for every part of the grid (only main area in the current version)
 * - sorting info
 * - drag-n-drop state
 * - current page info
 * Receives changes of the state and provides it for all parts.
 */
export abstract class GridState extends AxInjectConsumer {

  @AxInject('dataSource')
  public dataSource: DataSource;

  @AxInject('selection')
  public selection: Selection;

  @AxInject('check')
  public check: GridCheckHandler;

  @AxInject('dragDrop')
  public dragDrop: GridDragHandler;

  @AxInject('ui')
  public ui: GridUIHandler;

  @AxInject('lazyLoader')
  public lazyLoader: GridLazyLoadHandler;

  @AxInject('events')
  public events: IEvents;

  @AxInject('layouts')
  public layoutsHandler: LayoutsHandler;

  /**
   * Список колонок
   */
  @AxInject('columns')
  public columnCollection: ColumnCollection; // = new ColumnCollection();

  /**
   * Grid's settings.
   * Будет создано. Но можем и поменять. Если меняем - обновляем в хэндлерах.
   */
  @AxInject('settings')
  private _settings: GridSettings;

  public set settings(s: GridSettings) {
    this._settings = s;
    this.updateInjections();
  }

  public get settings(): GridSettings { return this._settings; }
  public get st(): GridSettings { return this._settings; } // Short alias
  public get sta(): GridAppearance { return this.settings.appearance; } // Short alias

  /**
   * Данные грида
   */
  public set model(rows: any[]) {
    this.dataSource.model = rows;
  }

  public get model(): any[] {
    return this.dataSource.model;
  }

  public set columns(v: Column[]) {
    this.columnCollection.columns = v;
    this.layoutsHandler.setLayoutsVisibility();
    this.updateLayouts();
  }

  public get columns(): Column[] {
    return this.columnCollection.columns;
  }

  public get layout(): GridLayout {
    return this.layoutsHandler.layout;
  }

  public get layoutDrag(): GridLayout {
    return this.layoutsHandler.layoutDrag;
  }

  // -- etc --
  public IE: boolean = Utils.detectIE();
  public iOS: boolean = Utils.detectIOS();
  public android: boolean = Utils.detectAndroid();
  public safari: boolean = Utils.detectSafari();

  public pageInfo: PageInfo = new PageInfo(0, 1);

  // Это всё мы передадим в обработчики

  public get showFixedLeft(): boolean {
    return false;
  }

  public get showFixedRight(): boolean {
    return false;
  }

  public set showFixedLeft(v: boolean) { }

  public set showFixedRight(v: boolean) { }

  /**
   * Gets column by field name
   * @param  f Field name
   * @return   Column if exists
   */
  public columnByFieldName(f: string): Column {
    return this.columnCollection.columnByFieldName(f);
  }

  /**
   * Отображать ли данные в виде дерева
   */
  public get isTree(): boolean {
    // Текущая версия не поддерживает отображение дерева
    return false;
  }

  /**
   * Уровень вложенности - ноль
   */
  public get maxLevel(): number  {
    return 0;
  }

  /**
   * The width of viewport's visible area.
   * This property is used for column's width calculation
   * with setting columnAutoWidth=true.
   */
  private _clientWidth = 0;

  public get clientWidth() {
    return this._clientWidth;
  }

  private _clientHeight = 0;

  public get clientHeight() {
    return this._clientHeight;
  }

  /**
   * The list of grid parts
   */
  public get layouts(): Array<GridLayout> {
    return this.layoutsHandler.layouts;
  }

  /**
   * The device supporting touch events is used.
   */
  public get touchMode(): boolean {
    return this.iOS || this.android;
  }

  /**
   * Index of the first row is displayed according to current scroll position.
   */
  private _displayedStartIndex = 0;
  public set displayedStartIndex(index: number) {
    this._displayedStartIndex = index;
    this.layouts.forEach(l => l.selection.updateDisplayedStartIndex(index));
  }

  public get displayedStartIndex():  number {
    return this._displayedStartIndex;
  }

  /**
   * Data query counter
   */
  protected _dataQueryCounter = 0;

  // ---------------------------------------------------------------------------

  public checkClientWidth(v: number): boolean {
    if (this._clientWidth !== v) {
      this._clientWidth = v;
      this.updateLayouts();
      return true;
    }
    return false;
  }

  public checkClientHeight(v: number): boolean {
    let res = false;
    if (this._clientHeight !== v) {
      res = true;
    }
    this._clientHeight = v;
    return res;
  }

  /**
   * Recalculation of rows in accordance with the specified filters,
   * sorting and other.
   */
  protected recalcData(): Promise<void> {
    return new Promise((resolve) => {
      this.dataSource.recalcData();
      resolve();
    });
  }

  public getQuery(subject: any = null): DataQuery {
    return this.dataSource.getQuery(++this._dataQueryCounter, subject);
  }

  /**
   * Request data from an observer.
   * @param  counter Query counter value
   * @param  subject Observer
   */
  protected doQuery(subject: any = null) {
    if (this.lazyLoader.query()) {
      // Если запрос сделает ленивый загрузчик, то выходим
      return;
    }
    this.events.dataQueryEvent(this.getQuery());
  }

  /**
   * Initiation of data update with all recalculations.
   * @param  async Recalculation in the asynchronous thread.
   */
  public updateData(async: boolean = true) {
    if (this.settings.requestData || this.settings.lazyLoading !== LazyLoadingMode.NONE) {
      // Необходимо запросить данные
      this.doQuery();
      // НО! Нужно обновить колонки.
      this.events.columnsChangedEvent();
      return;
    }

    // Запрашивать не нужно, считаем всё сами
    if (async) {
      // Асинхронное обновление
      this.recalcData().then(() => {
        this.fetchData(new DataQuery(this._dataQueryCounter));
      });
    } else {
      // Синхронное
      this.dataSource.recalcData();
      this.fetchData(new DataQuery(this._dataQueryCounter));
    }
  }

  // Принимаем данные извне
  public fetchData(query: DataQuery, data: any[] = null, totalRowCount: number = null) {

    if (this.settings.lazyLoading !== LazyLoadingMode.NONE) {
      this.lazyLoader.fetch(data, query, totalRowCount);
    } else {
      // Если счетчик не совпадает, то позднее был новый запрос. И в этих данных смысла
      // уже нет
      if (this._dataQueryCounter !== query.queryId) {
        return;
      }
      if (data !== null) {
          // Если данные пересчитаны извне..
          this.dataSource.fetchData(data, totalRowCount);
      }
    }

    // Обновить нужно. Потому что уровни дерева могли поменяться
    this.updateLayouts();
    // Обновляем галки колонок
    this.check.updateCheckColumns();
    // Обновляем индексы строк выделенных областей
    this.layoutsHandler.updateSelectionIndices();
    // Отправляем информацию о том, что данные получены
    this.events.dataFetchEvent(query);
  }

  // Обновляем отображаемые данные в основном компоненте
  protected queryChanged() {
    // Генерируем событие о необходимости обновления данных
    // Проверяем ленивую загрузку с флагом сбрасывания данных
    //if (!this.lazyLoader.query(0, true)) {
      // Если не ленивая загрузка, то как всегда.
      // Иначе ленивая загрузка сама отправит данные
      this.events.queryChangedEvent(this.dataSource.getQuery());
    //}
    // вроде как здесь не нужна эта тема с ленивой загрузкой, т.к. при
    // updateData всё происходит
  }

  // Делаем так, чтобы ничего не было выделено
  public clearSelection() {
    this.selection.clearAll();
  }

  // -- LAYOUTS ----------------------------------------------------------------
  // Обновление состояния дочерних компонентов
  public updateLayouts() {

    if (!this.columns) {
      throw new Error('GRID: Columns are not defined');
    }

    // Все секции. Хотя пока у нас и одна только..
    // Автоматическая ширина колонок только в основной секции
    this.layouts.forEach(l => l.update(
      this.columns,
      this.st.widthUnit,
      this.st.levelIndent,
      this.clientWidth, l === this.layout && this.st.columnAutoWidth));

    // Это для нас обновление сопутствующих дел
    this.resizeLayouts();
    this.layoutsHandler.updateLayoutSelections();
  }

  protected resizeLayouts() {
    this.layouts.forEach(l => l.resize(this.st.widthUnit, this.st.levelIndent,
      this.clientWidth, l === this.layout && this.st.columnAutoWidth));
  }

  // Фильтр
  public showFilter(e: any, c: Column) {
    let f =  this.dataSource.getFilter(c);
    f = f ? f.clone(true) : c.createFilter(this.selection.focusedValue(c));
    this.events.filterShowEvent(new FilterShowEvent(e.target, f));
  }

  // Установка фильтра
  public setFilter(f: Filter) {
    this.dataSource.setFilter(f);
    this.queryChanged();
  }

  // Очистка фильтра по заданной колонке
  public resetFilter(f: Filter) {
    if (this.dataSource.removeFilter(f.fieldName)) {
      this.queryChanged();
    }
  }

  /**
   * Data sorting
   * @param  sortings List of sortings
   */
  public sort(sortings: SortInfo[], update: boolean = true) {
    this.dataSource.sort(sortings);
    if (update) {
      this.queryChanged();
    }
  }

  /**
   * Data filtering
   * @param  filter List of filters
   */
  public filter(filters: Filter[], update: boolean = true) {
    this.dataSource.filter(filters);
    if (update) {
      this.queryChanged();
    }
  }

  /**
   * Sort by given column
   * @param  col Column
   * @param  add Если true, то оставляем предыдущую сортировку (с зажатым shift)
   */
  public sortByColumn(col: Column, add: boolean) {
    if (!this.st.allowSorting) {
      return;
    }
    this.dataSource.sortByColumn(col, add);
    this.queryChanged();
  }

  /**
   * Сортировать по полю
   * @param  fieldName Наименование поля
   * @param  add       Добавить сортировку к другим сортировкам
   */
  public sortByField(fieldName: string, add: boolean) {
    const col: Column = this.columnByFieldName(fieldName);
    this.sortByColumn(col, add);
  }

  // -- COLUMN RESIZING & REORDERING -------------------------------------------
  // Изменение ширины колонки
  public resizeColumn(col: Column, newWidth: number) {
    col.width = newWidth;
    this.updateLayouts();
    this.events.columnsChangedEvent();
  }

  public hideColumn(col: Column) {
    col.visible = false;
    this.updateLayouts();
    this.events.columnsChangedEvent();
  }

  // Чиним состояние после drag-n-drop
  public fixDrag(target: Column) { }

  // Перемещение бэнда
  public reorderBand(targetBand: ColumnBand, dropInfo: any) {
    if (this.columnCollection.reorderBand(targetBand, dropInfo)) {
      this.updateLayouts();
      this.events.columnsChangedEvent();
    }
  }

  // Перемещение колонки
  public reorderColumn(target: Column, dropInfo: any, commit: boolean = true) {
    if (this.columnCollection.reorderColumn(target, dropInfo)) {
      this.updateLayouts();
      this.events.columnsChangedEvent();
    }
  }

  // -- PAGING -----------------------------------------------------------------
  // Проверка необходимости установки страницы отображаемых данных
  public needSetPage(i0: number, i1: number): boolean {
    return i0 < this.pageInfo.offset || i1 > (this.pageInfo.offset + this.pageInfo.limit);
  }

  // Установка страницы отображаемых данных
  public setPage(offset: number, limit: number) {
    this.pageInfo.offset = offset;
    this.pageInfo.limit = limit;
  }

  // Фокус сместился
  protected focusChanged(cp: CellPosition) {
    if (this.st.editorShowMode === EditorShowMode.ON_MOUSE_DOWN) {
      this.ui.stopEditing(this.ui.editor, cp !== null);
      this.ui.startEditing(cp);
    } else {
      this.ui.stopEditing(this.ui.editor, cp !== null);
    }
  }

  // Выделить заданную строку
  public selectRow(r: any, ri: number): CellPosition {
    return this.selection.selectRow(this.layouts, r, ri, '', this.settings.keyField);
  }

  // Выделение заданной строки
  public locateRow(r: any): boolean {
    const ri: number = this.dataSource.resultRows.indexOf(r);
    if (ri >= 0 ) {
      this.selectRow(r, ri);
      return true;
    }
    return false;
  }

  // Выделение строки по значению поля-идентифиатора
  public locateByKey(keyValue: any, keyField: string = ''): boolean {
    if (keyField === '') {
      keyField = this.settings.keyField;
    }

    if (this.dataSource.resultRowCount === 0) {
      return false;
    }

    const found = this.dataSource.resultRows.find(r => r[keyField] === keyValue);
    if (found) {
      const ri: number = this.dataSource.resultRows.indexOf(found);
      if (ri >= 0 ) {
        this.selectRow(found, ri);
        return true;
      }
    }
    return false;
  }

  // -- HEADER CONTEXT MENU ----------------------------------------------------
  public headerContextMenu(e: any, column: Column) {
    this.events.headerContextMenuEvent({originalEvent: e, column: column});
  }

  // -- SUMMARIES --------------------------------------------------------------
  public updateSummaries() {
    this.dataSource.summaries(this.columns);
  }
  // Добавляет суммирование
  public addSummary(column: Column, t: SummaryType) {
    column.addSummary(t);
    this.events.summariesChangedEvent(column);
  }

  // Заменяет суммирование
  public setSummary(column: Column, t: SummaryType, a: Summary = null) {
    column.setSummary(t, a);
    this.events.summariesChangedEvent(column);
  }

  // -- ROW DRAG ---------------------------------------------------------------
  public canDrop(draggedRows: any[], dropRow: any, dropPos: string): string {
    return this.dataSource.canDrop(draggedRows, dropRow, dropPos);
  }

  public moveRows(draggedRows: any[], dropTarget: any, dropPos: string) {
    this.dataSource.moveRows(draggedRows, dropTarget, dropPos);
    this.updateData();
  }

  protected headerContextMenuEvent(e: any, column: Column) {
    // Not implemented
  }

  public getSelectedData(selection: Selection): GridExporter {
    return GridExporter.dataToExport(
      this.layouts, selection, this.st.selectionMode,
      this.dataSource.resultRows, this.dataSource.valueFormatter);
  }

  public selectAll(sel: Selection): Selection {
    const firstCol = GridLayout.firstColumn(this.layouts);
    const lastCol = GridLayout.lastColumn(this.layouts);
    const rr = this.dataSource.resultRows;

    sel.startSelect(new CellPosition(rr[0], 0, firstCol.fieldName));
    sel.proceedToSelect(new CellPosition(rr[rr.length - 1], rr.length - 1, lastCol.fieldName), false);
    return sel;
  }

  // -- Data to export
  public dataToExport(): GridExporter {
    return GridExporter.dataToExport(
      this.layouts, this.selectAll(new Selection()), SelectionMode.RANGE,
      this.dataSource.resultRows, this.dataSource.valueFormatter);
  }

  // -- CUSTOM CELL EVENTS -----------------------------------------------------
  public emitCustomCellEvent(e: any) {
    this.events.customCellEvent(e);
  }

  public abstract copySelectionToClipboard(withColumns: boolean): void;
  public abstract exportToCSV(fileName: string): void;

  protected registerHandlers() {
    this.handlers = {
      'settings': GridSettings,
      'columns': ColumnCollection,
      'selection': Selection,
      'dataSource': DataSource,
      'check': GridCheckHandler,
      'ui': GridUIHandler,
      'lazyLoader': GridLazyLoadHandler,
      'dragDrop': GridDragHandler,
      'layouts': LayoutsHandler
    };
  }

  constructor() {
    super();
    this.registerHandlers();
    this.updateInjections();
  }
}
