/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/

/**
 * Действия, доступные через контекстные меню (данные, заголовки)
 */
export class MenuAction {

  public disabled: boolean = false;

  constructor(
    public name: string,
    public group: string,
    public icon: string = '') { }

  static CUSTOM = new MenuAction('Custom Action', 'Custom');

  static COPY = new MenuAction('Copy', 'copy');
  static COPY_WITH_HEADERS = new MenuAction('Copy with headers', 'copy');

  static EXPORT_CSV = new MenuAction('Export to CSV', 'export');
  static EXPORT_XLS = new MenuAction('Export to XLSX', 'export');

  static FILTER = new MenuAction('Filter', 'column');
  static GROUP_BY_COLUMN = new MenuAction('Group by this column', 'column');
  static HIDE = new MenuAction('Hide this column', 'column');
  static COLUMN_LIST = new MenuAction('Column list', 'column');

  static SORT_ASC = new MenuAction('Sort Ascending', 'sort', 'true-icon-sort-alt-up');
  static SORT_DESC = new MenuAction('Sort Descending', 'sort', 'true-icon-sort-alt-down');
}
