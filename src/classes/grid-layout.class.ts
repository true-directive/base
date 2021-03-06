/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { GridPart } from './enums';
import { Column } from './column.class';
import { ColumnBand } from './column-band.class';
import { GridLayoutSelection } from './grid-layout-selection.class';
import { UIAction } from './ui-action.class';
import { ColumnCollection } from './column-collection.class';

/**
 * Разметка секции грида.
 * Содержит колонки только своей секции
 * Пересчитывает их ширину
 * Содержит информацию о выделенных областях своей секции
 * @return [description]
 */
export class GridLayout {

  // Уровни группировки генерируются вместе с первой видимой колонкой, но не
  // считая чекбокса.
  public groupLevels = false;

  public columns: Column[] = [];
  public bands: ColumnBand[] = [];
  public totalWidth: number;

  public readonly selection: GridLayoutSelection = new GridLayoutSelection();

  // Вспомогательное поле для идентификации лэйаута
  public tag = '';

  private _levelColumns: Column[] = [];
  private _autoWidth = false;
  private _widthUnit: string;
  private _levelIndent: number;

  // Список виртуальных колонок для отступов
  get levelColumns() {
    return this._levelColumns;
  }

  // Находится ли эта разметка слева
  public get isLeft() {
    return this.place === GridPart.LEFT;
  }

  // Находится ли эта разметка в основной части
  public get isCenter() {
    return this.place === GridPart.CENTER;
  }

  // Находится ли эта разметка справа
  public get isRight() {
    return this.place === GridPart.RIGHT;
  }

  // Обновить список полей группировки
  public updateGroupedColumns(groupedColumns: Column[]) {

    if (groupedColumns === null) {
      this._levelColumns = [];
      return;
    }

    const lc: Column[] = [];

    if (groupedColumns.length > 0) {
      lc.push(new Column('_', '', this._levelIndent)); // Для стрелки
    }

    groupedColumns.forEach((col, index) => {
      lc.push(new Column('__group_' + index, '', this._levelIndent));
    });

    this._levelColumns = lc;
  }

  // Обновление отступов для дерева
  public updateTreeColumns(maxLevel: number) {
    const lc: Column[] = [];

    if (maxLevel > 0) {
      // Для стрелки
      lc.push(new Column('_', '', this._levelIndent));
    }

    for (let i = 0; i < maxLevel; i++) {
      lc.push(new Column('__group_' + i, '', this._levelIndent));
    }

    this._levelColumns = lc;
  }

  // Суммарная ширина отступов
  public get levelsWidth(): number {
    return this._levelColumns.length * this._levelIndent;
  }

  // Ширина колонки
  private columnDataWidth(col: Column): number {
    return col.width;
  }

  // Ширина колонки в заголовке
  public columnHeaderWidth(col: Column): number {

    // Отступы уровней добавляем к первой не чекбоксовой колонке
    for (let i = 0; i < this.columns.length; i++) {
      const c = this.columns[i];
      if (c.isCheckbox) {
        continue;
      }
      // Если это убрать, то нужно сделать синхронно с row.directive
      if (c === col) {
        return (col.displayedWidth + this.levelsWidth);
      }
      break;
    }
    return col.displayedWidth;
  }

  public displayedHeaderWidth(col: Column): string {
    // Если нет группировок или уровней, то легко
    if (this._levelColumns.length === 0) {
      return col.displayedWidthU;
    }
    return this.columnHeaderWidth(col) + this._widthUnit;
  }

  // Суммарная ширина всех заголовков
  public get headerWidth(): string {

    if (this.place === GridPart.CENTER) {
      let ww = this.totalWidth + this.levelsWidth;

      if (this._widthUnit === 'px') {
        ww += 96;
      } else {
        ww += 10;
      }
      return ww + this._widthUnit;
    }

    return this.totalWidth + this.levelsWidth + this._widthUnit;
  }

  // Суммарная ширина данных
  public get dataWidth(): string {

    const ww = this.totalWidth + this.levelsWidth;

    if (this._autoWidth) {
      return ww + 'px';
    }
    return ww + this._widthUnit;
  }

  // Количество видимых колонок с учетом временно вынесенной в панель группировки
  public visibleColumnCount(groupedTemp: any): number {
    let res = 0;
    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      if (groupedTemp && groupedTemp.fieldName === col.fieldName) {
        continue;
      }
      if (col.visible) {
        res++;
      }
    }
    return res;
  }

  // Обновление разметки
  public update(columns: Column[], widthUnit: string = 'px', levelIndent: number = 0, clientWidth: number = 0, autoWidth: boolean = false) {
    this._levelIndent = levelIndent;
    this._widthUnit = widthUnit;
    this.bands = [];
    this.columns = [];

    let gLevels = false;

    if (columns !== undefined) {

      let currentBand: string = '';
      let currentBandColumns: Column[] = [];
      let hasBands = false;
      let bandWidth = 0;
      let isFirstColumn = true;

      for (const column of columns) {
        if (!column.visible) {
          continue;
        }

        if (!column.isCheckbox && isFirstColumn) {
          if (column.fixed === this.place) {
            gLevels = true;
          }
          isFirstColumn = false;
        }

        if (column.fixed !== this.place && this.place !== GridPart.GROUPED_COLUMN)  {
          // в сгруппированном всегда показываем
          continue;
        }

        let ww = column.width;
        if (column.isCheckbox) {
          ww = this._levelIndent;
        }

        this.columns.push(column);

        if (column.band !== currentBand) {
          if (currentBand) {
            const band = new ColumnBand(currentBand, currentBandColumns, bandWidth);
            this.bands.push(band);
          }
          hasBands = true;
          currentBandColumns = [];
          currentBand = column.band;
          bandWidth = 0;
        }
        currentBandColumns.push(column);
        bandWidth += ww;
      }

      if (hasBands) {
        this.bands.push(new ColumnBand(currentBand, currentBandColumns, bandWidth));
      }
    }

    this.resize(widthUnit, levelIndent, clientWidth, autoWidth);
    this.groupLevels = gLevels;
  }

  // Минимальная ширина с заданным набором колонок
  private minWidth(): number {
    let res = this.levelsWidth;
    this.columns.forEach(c => res += c.autoWidthFixed ? c.width : (c.autoWidthMin ? c.autoWidthMin : 0));
    return res;
  }

  // Убираем одну колонку с конца с наименьшим приоритетом
  private removeColumnWithLowPriority(): boolean {
    let min: number = undefined;
    this.columns.forEach(c => {
      if (min === undefined || c.autoWidthPriority < min) {
        min = c.autoWidthPriority;
      }
    });

    if (min === undefined) {
      return false;
    }

    for (let i = this.columns.length - 1; i >= 0; i--) {
      const c = this.columns[i];
      if (c.autoWidthPriority === min) {
          this.columns.splice(i, 1);
          // Убираем колонку из бэнда и сам бэнд, если он опустел
          const band  = this.bands.find(b => b.columns.indexOf(c) >= 0);
          if (band) {
            band.removeColumn(c);
            if (band.columns.length === 0) {
              this.bands.splice(this.bands.indexOf(band), 1);
            }
          }
        return true;
      }
    }
    return false;
  }

  private fixedSize(c: Column): number {
    // autoWidthMin может быть не задана для чекбокса, например
    if (c.autoWidthFixed) {
      return c.width;
    }
    return isNaN(c.autoWidthMin) ? c.width : c.autoWidthMin;
  }

  //
  private calcWidth(fixedSizeColumns: Array<Column>, clientWidth: number): Array<{c: Column, width: number}> {
    const res: Array<{c: Column, width: number}> = [];
    let fixedSize = 0;
    fixedSizeColumns.forEach(c => fixedSize += this.fixedSize(c));
    const remains = clientWidth - fixedSize - this.levelsWidth;
    let totalWidth = 0;

    this.columns.forEach(c => {
      if (fixedSizeColumns.indexOf(c) < 0) {
        totalWidth += c.width;
      }
    });

    this.columns.forEach(c => {
      if (fixedSizeColumns.indexOf(c) >= 0) {
        res.push({c: c, width: this.fixedSize(c)});
      } else {
        res.push({c: c, width: Math.floor(c.width * remains / totalWidth)});
      }
    });
    return res;
  }

  // Автоматический пересчет ширины колонок
  public resize(widthUnit: string, levelIndent: number, clientWidth: number, autoWidth: boolean) {

    this._autoWidth = autoWidth;
    this.totalWidth = 0;

    if (this.columns.length === 0) {
      return;
    }

    let sizes: Array<{c: Column, width: number}> = [];

    if (autoWidth) {
      // Удалим колонки, которые никак не влезут
      let res = true;
      while (autoWidth && this.minWidth() > clientWidth && res) {
        res = this.removeColumnWithLowPriority();
      }

      // Последовательно фиксируем ширину колонок, если расчетная меньше минимальной
      const fixedCols: Array<Column> = [];
      let recalc = true;
      while (autoWidth && recalc) {
        recalc = false;
        sizes = this.calcWidth(fixedCols, clientWidth);
        sizes.some(s => {
          // Проверяем, устроит ли нас длина
          if (fixedCols.indexOf(s.c) < 0
              && (s.width < s.c.autoWidthMin || s.c.autoWidthFixed || s.c.isCheckbox)) {
            fixedCols.push(s.c); // Не устроила
            recalc = true;
            return true;
          }
          return false;
        });
      }
    }

    // Фиксируем
    let newTotalWidth = 0;
    let firstCol = true;
    for (let i = 0; i < this.columns.length; i++) {

      const c = this.columns[i];

      c.displayedWidth = c.width;
      c.displayedWidthU = c.width + this._widthUnit;

      if (autoWidth) {
        c.displayedWidth = sizes.find(s => s.c === c).width;
        c.displayedWidthU = c.displayedWidth + 'px';
      }

      if (firstCol && !c.isCheckbox) {
        c.headerWidth = c.displayedWidth + this.levelsWidth;
        firstCol = false;
      } else {
        c.headerWidth = c.displayedWidth;
      }

      newTotalWidth += c.displayedWidth;
    }

    // Отброшенные дробные части плюсуем к первой колонке
    if (autoWidth && this.columns.length > 0) {
      this.columns[0].displayedWidth += clientWidth - newTotalWidth - this.levelsWidth;
      this.columns[0].displayedWidthU = this.columns[0].displayedWidth + 'px';
    }

    this.totalWidth = newTotalWidth;
  }

  /**
   * Is it possible to reorder the column at the specified coordinates?
   * @param  mouseAction User action info with mouse coordinates
   * @param  items       List of column headers or bands
   * @param  r0          Header bounding rectangle
   * @param  hasL        We have part positioned to left of this part
   * @param  hasR        We have part positioned to right of this part
   * @param  columns     Columns collection of the grid
   * @return             Possibility of reordering, position
   */
  public canDrop(mouseAction: UIAction, items: any[], r0: DOMRect, hasL: boolean, hasR: boolean, columns: ColumnCollection): any {

    let result = null;
    const tg = mouseAction.target;

    if (mouseAction.y < r0.top) {
      return result;
    }

    const isColumn = tg instanceof Column;
    const isBand = tg instanceof ColumnBand;

    if (mouseAction.y < r0.top) {
      return result;
    }

    if (items.length === 0 && mouseAction.x >= r0.left && mouseAction.x < r0.right) {
      return { inColumns: isColumn, item: null, pos: 'left', place: this.place };
    }

    let mrX = 0;
    const cbCol = columns.prevCheckbox(tg);

    // Необходимо перебрать колонки и понять, сможем ли мы бросить сюда наш заголовок.
    for (let i=0; i < items.length; i++) {

      const isFirst = i === 0;
      const isLast = i === items.length - 1;

      let rr = items[i].boundingRect;
      let item = items[i].item;

      if (mouseAction.inItemRect(r0, rr)) {

        // проверяем, можно ли вставить колонку сюда..
        let canDropLeft = true;
        let canDropRight = true;

        if (isColumn && tg.fieldName === item.fieldName) {
          // Навели на себя же
          canDropLeft = false;
          canDropRight = false;
        }

        if (cbCol && cbCol.fieldName === item.fieldName) {
          // Навели на чекбокс, который прилеплен к перетаскиваемой колонке
          canDropLeft = false;
          canDropRight = false;
        }

        if (item.isCheckbox && i < items.length - 1)  {
          canDropRight = false; // между чекбоксом и норм столбцом не вклиниваемся
        }

        // Не самый первый элемент
        if (!isFirst) {

          const prevItem = items[i - 1].item;

          // Простая проверка - для колонки
          if (isColumn && prevItem.fieldName === tg.fieldName) {
            canDropLeft = false;
          }

          if (isColumn && prevItem.isCheckbox) {
            if (cbCol && cbCol.fieldName === prevItem.fieldName) {
              canDropLeft = false;
            }
          }

          if (isBand && tg.columns[tg.columns.length - 1].fieldName === prevItem.columns[prevItem.columns.length - 1].fieldName) {
            canDropLeft = false;
          }
        }

        // Бэнд
        if (isBand) {
          // Нельзя бросить бэнд слева от себя
          if (tg.columns[0].fieldName === item.columns[0].fieldName) {
            canDropLeft = false;
          }

          // Нельзя бросить справа от себя
          if (tg.columns[tg.columns.length - 1].fieldName === item.columns[item.columns.length - 1].fieldName) {
            canDropRight = false;
          }

          //
          if (tg.columns[0].fieldName === item.columns[item.columns.length - 1].fieldName) {
            canDropRight = false;
          }

          if (tg.columns[tg.columns.length - 1].fieldName === item.columns[0].fieldName) {
            canDropLeft = false;
          }
        }

        // Не последний элемент
        if (!isLast) {

          const nextItem = items[i + 1].item;
          if (isColumn && nextItem.fieldName === tg.fieldName) {
            canDropRight = false;
          }

          if (isBand && tg.columns[0].fieldName === nextItem.columns[0].fieldName) {
            canDropRight = false;
          }

          if (isColumn && nextItem.isCheckbox) {
            if (cbCol && cbCol.fieldName === nextItem.fieldName) {
              canDropRight = false;
            }
          }
        }

        // Если мы вписываемся в наш компонент, то показываем сразу..
        // Иначе нам нужно скрыть и немного проскроллить..
        let showMarker = false;

        if ((mouseAction.x - rr.left < rr.width / 2 || item.isCheckbox) && canDropLeft) {

          if (i > 0 && items[i - 1].item.isCheckbox) {
            // Колонка с чекбоксом неразделимы
            item = items[i - 1].item;
            rr =  items[i - 1].boundingRect;
          }

          mrX = rr.left - 1;
          showMarker = true;
          result = { inColumns: isColumn, item: item, pos: 'left' };
        } else
          if (mouseAction.x - rr.left >= rr.width / 2 && canDropRight) {
            mrX = rr.right - 1;
            showMarker = true;
            result = { inColumns: isColumn, item: item, pos: 'right' };
          }

        return result;
      }
    }

    return result;
  }

  /**
   * Returns the column index in the column list by field name
   * @param  fieldName Name of the field to be searched
   * @return           Column index
   */
  public static columnIndex(layouts: GridLayout[], fieldName: string): number {
    let i = 0;
    let res = -1;
    layouts.forEach(l => {
      for (let j = 0; j < l.columns.length && res < 0; j++) {
        if (l.columns[j].fieldName === fieldName) {
          res = i;
          break;
        }
        i++;
      }
    });
    return res;
  }

  public static columnByIndex(layouts: GridLayout[], index: number): Column {
    let i = 0;
    let res = null;
    layouts.forEach(l => {
      for (let j = 0; j < l.columns.length; j++) {
        if (i === index) {
          res = l.columns[j];
          break;
        }
        i++;
      }
    });
    return res;
  }

  public static columnCount(layouts: GridLayout[]): number {
    let res = 0;
    layouts.forEach(l => {
        res += l.columns.length;
    });
    return res;
  }

  public static firstColumn(layouts: GridLayout[]): Column {
    return GridLayout.columnByIndex(layouts, 0);
  }

  public static lastColumn(layouts: GridLayout[]): Column {
    return GridLayout.columnByIndex(layouts, GridLayout.columnCount(layouts) - 1);
  }

  constructor(public place: GridPart) { }
}
