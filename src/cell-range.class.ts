/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { CellPosition } from './cell-position.class';
import { SelectionMode } from './enums';

/**
 * Range of cells
 * Rectangular area in the grid. Defined by:
 *  - fromCell: CellPosition  - starting cell.
 *  - toCell: CellPosition - end cell.
 */
export class CellRange {

  public toCell: CellPosition = null;

  /**
   * Always lower row index
   */
  public get fromRow() {
    if (this.toCell !== null && this.toCell.rowIndex < this.fromCell.rowIndex) {
      return this.toCell.rowIndex;
    }
    return this.fromCell.rowIndex;
  }

    /**
     * Always higher row index
     */
  public get toRow() {
    if (this.toCell !== null && this.toCell.rowIndex < this.fromCell.rowIndex) {
      return this.fromCell.rowIndex;
    }

    return this.toCell !== null ? this.toCell.rowIndex : this.fromCell.rowIndex;
  }

  // Column indices are unknown
  public get fromField(): string {
    return this.fromCell.fieldName;
  }

  // Column indices are unknown
  public get toField(): string {
    if (this.toCell === null) {
      return this.fromCell.fieldName;
    }
    return this.toCell.fieldName;
  }

  public equals(range: CellRange, sm: SelectionMode): boolean {
    if (sm === SelectionMode.ROW || sm === SelectionMode.ROW_AND_RANGE) {
      if (this.fromCell.row === range.fromCell.row) {
        if (this.toCell === null && range.toCell === null) {
          return true;
        }
      }
    }

    if (this.fromCell.row !== range.fromCell.row) {
      return false;
    }

    if (this.fromCell.fieldName !== range.fromCell.fieldName) {
      return false;
    }

    if (this.toCell === null && range.toCell !== null) {
      return false;
    }

    if (this.toCell !== null && range.toCell === null) {
      return false;
    }

    if (!this.toCell.equals(range.toCell)) {
      return false;
    }

    return true;
  }

  public clone(): CellRange {
    const res = new CellRange(this.fromCell.clone());
    if (this.toCell !== null) {
      res.toCell = this.toCell.clone();
    }
    return res;
  }

  /**
   * Extends range to a given cell position.
   * @param  pos Cell position.
   * @return     Is range changed.
   */
  public extend(pos: CellPosition): boolean {

    if (pos.fieldName === this.fromCell.fieldName &&
        pos.rowIndex === this.fromCell.rowIndex) {
      const res = this.toCell !== null;
      this.toCell = null;
      return res;
    }

    if (!this.toCell && !pos) {
      return false;
    }

    if (!this.toCell && pos) {
      this.toCell = pos;
      return true;
    }

    if (this.toCell && !pos) {
      this.toCell = null;
      return true;
    }

    if (this.toCell.row !== pos.row ||
        this.toCell.rowIndex !== pos.rowIndex ||
        this.toCell.fieldName !== pos.fieldName) {
      this.toCell = pos;
      return true;
    }

    // Not changed
    return false;
  }

  constructor(public fromCell: CellPosition) { }
}
