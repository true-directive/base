/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { PageInfo } from '../classes/page-info.class';

export class PagePipe {
  transform(rows: any[], pageInfo: PageInfo): any[] {
    const res: any[] = [];

    let i = pageInfo.offset;
    while (i < (pageInfo.offset + pageInfo.limit)) {
      if (!rows[i]) {
        // Иначе при ленивой загрузке сходит с ума trackBy
        rows[i] = {__ax: 'empty'};
      }
      res.push(rows[i]);
      i++;
    }
    return res;
  }
}
