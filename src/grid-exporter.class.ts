import { Column } from './column.class';
import { ColumnCollection } from './column-collection.class';
import { GridLayout } from './grid-layout.class';
import { Selection } from './selection.class';
import { SelectionMode } from './enums';
import { CellRange } from './cell-range.class';
import { ValueFormatter } from './value-formatter.class';
import { Utils } from './common/utils.class';

export class GridExporter {

  private minField: string = '';
  private maxField: string = '';
  private minColumnIndex?: number = null;
  private maxColumnIndex?: number = null;

  private cols: Array<{ column: Column, idx: number }>;
  private ranges: Array<{ range: CellRange, fromFieldIndex: number, toFieldIndex: number }>;

  public result: any[];
  public formattedResult: any[];

  private min(a: number, b: number) {
    return a > b ? b : a;
  }

  private max(a: number, b: number) {
    return a < b ? b : a;
  }

  private checkField(s: string): number {
    const i = GridLayout.columnIndex(this.layouts, s);
    if (this.minColumnIndex === null || this.minColumnIndex > i) {
      this.minField = s;
      this.minColumnIndex = i;
    }
    if (this.maxColumnIndex === null || this.maxColumnIndex < i) {
      this.maxField = s;
      this.maxColumnIndex = i;
    }
    return i;
  }

  private fieldName(i: number) {
    return this.cols.find(c => c.idx === i);
  }

  private getRow(i: number) {
    while (i >= this.result.length) {
      this.result.push({});
    }
    return this.result[i];
  }

  private getFormattedRow(i: number) {
    while (i >= this.formattedResult.length) {
      this.formattedResult.push({});
    }
    return this.formattedResult[i];
  }

  // -- Get the data to export
  public getData(): any[] {

    this.result = [];
    this.formattedResult = [];
    if (this.selection.ranges.length === 0) {
      return this.result;
    }

    // Reset temp data
    this.cols = [];
    this.ranges = [];

    // Sort ranges by first row index
    const ranges = this.selection.ranges.sort((r1, r2) => {
      return r1.fromRow > r2.fromRow ? 1 : -1;
    });

    // Persist first and last field indices
    this.minField = ''; this.minColumnIndex = null;
    this.maxField = ''; this.maxColumnIndex = null;
    ranges.forEach(r => {
      let fromField = r.fromField;
      let toField = r.toField;
      if (fromField === toField && r.fromRow === r.toRow) {
        if (this.selectionMode === SelectionMode.ROW || this.selectionMode === SelectionMode.ROW_AND_RANGE) {
          fromField = GridLayout.firstColumn(this.layouts).fieldName;
          toField = GridLayout.lastColumn(this.layouts).fieldName;
        }
      }

      const a = this.checkField(fromField);
      const b = this.checkField(toField);
      this.ranges.push({
        range: r,
        fromFieldIndex: this.min(a, b),
        toFieldIndex: this.max(a, b)
      });
    });

    // Create column's list
    for (let i: number = this.minColumnIndex; i <= this.maxColumnIndex; i++ ) {
      this.cols.push({
        idx: i,
        column: GridLayout.columnByIndex(this.layouts, i)
      });
    }

    let i0 = ranges[0].fromRow;

    this.ranges.forEach(r =>  {
      for (let j: number = r.range.fromRow; j <= r.range.toRow; j++) {
        const row = this.getRow(j - i0);
        const formattedRow = this.getFormattedRow(j - i0);
        const srcRow = this.resultRows[j];
        for (let k: number = r.fromFieldIndex; k <= r.toFieldIndex; k++) {
          // Get and format value
          const column = this.fieldName(k).column;
          const value = srcRow[column.fieldName];
          const formattedValue = this.valueFormatter.displayedValue(column, value, srcRow);
          const plainValue = Utils.htmlToPlaintext(formattedValue)
          row[column.fieldName] = value;
          formattedRow[column.fieldName] = plainValue;
        }
      }
    });

    return this.result;
  }

  public static dataToExport(layouts: GridLayout[],
                      selection: Selection,
                      selectionMode: SelectionMode,
                      resultRows: any[],
                      valueFormatter: ValueFormatter): GridExporter {
    const e = new GridExporter(layouts, selection, selectionMode, resultRows, valueFormatter);
    e.getData();
    return e;
  }

  public toString(
      withHeaders: boolean = false,
      columnSeparator: string = ',',
      encloseDataIntoDoubleQuotes: boolean = false) {

    let txt = '';

    if (withHeaders) {
      txt += this.cols.map(c => {
        let v = c.column.caption;
        if (encloseDataIntoDoubleQuotes) {
          v = `"${v.replace(`"`, `""`)}"`;
        }
        return v;
      }).join(columnSeparator) + `\n`;
    }

    txt += this.formattedResult.map(row => {
      return this.cols.map(c => {
        let v = row[c.column.fieldName] !== undefined ? row[c.column.fieldName] : '';
        if (encloseDataIntoDoubleQuotes) {
          v = `"${v.replace(`"`, `""`)}"`;
        }
        return v;
      }).join(columnSeparator);
    }).join('\n');

    return txt;
  }

  constructor(private layouts: GridLayout[],
              private selection: Selection,
              private selectionMode: SelectionMode,
              private resultRows: any[],
              private valueFormatter: ValueFormatter) { }
}
