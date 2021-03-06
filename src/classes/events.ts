import { CellPosition } from './cell-position.class';

export class CancelableEvent {
  private _isCanceled = false;
  public cancel() {
    this._isCanceled = true;
  }
  public get isCanceled() {
    return this._isCanceled;
  }
}

/**
 * Закрытие всплывающего окна
 * @param Результат работы всплывающего окна
 */
export class CloseEvent extends CancelableEvent {
  confirmed: boolean = false;
  constructor(public result: any) {
    super();
  }
}

export class CheckedChangedEvent {
  constructor(
    public target: 'row' | 'column',
    public row: any,
    public fieldName: string,
    public value?: boolean) { }
}

export class ValueChangedEvent {
  constructor(public row: any, public fieldName: string) { }
}

export class FilterShowEvent {
  constructor(public target: any, public filter: any) { }
}

export class RowDragEvent extends CancelableEvent {
  constructor(
    public rows: any[],
    public target: any,
    public position: string,
  ) {
    super();
  }
}

export class RowClickEvent {
  constructor(
    public row: any,
    public originalEvent: MouseEvent
  ) { }
}

export class CellClickEvent {
  constructor(
    public cell: CellPosition,
    public originalEvent: MouseEvent
  ) { }
}

export class ContextMenuEvent {
    constructor(
      public cell: CellPosition,
      public originalEvent: MouseEvent
    ) { }
}
