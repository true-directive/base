/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { AxInject } from '../classes/ax-inject.class';

import { LazyLoadingMode } from '../classes/enums';
import { DataQuery } from '../classes/data-query.class';
import { GridSettings } from '../classes/grid-settings.class';
import { DataSource } from '../classes/data-source.class';

import { IEvents } from '../events.interface';

export class GridLazyLoadHandler {

  @AxInject('settings')
  settings: GridSettings;

  @AxInject('events')
  events: IEvents;

  @AxInject('dataSource')
  dataSource: DataSource;

  private _queriedFrom?: number = null;
  private _queriedTo?: number = null;

  private _loading = false;

  private _lazyOffset_tmp: number = null;
  private _lazyLimit_tmp: number = null;

  public query(offset: number = 0, reset: boolean = false): boolean {
     if (this.settings.lazyLoading === LazyLoadingMode.NONE) {
       return false;
     }

     const limit = this.settings.lazyLoadingPageSize;
     const e = this.events;
     const st = this.settings;

     this._lazyOffset_tmp = offset;
     this._lazyLimit_tmp = limit;

     const q = this.dataSource.getQuery();

     if (reset) {
       // Полное обновление, всё сразу делаем
       const res = this.check(q, offset, limit, reset);
       if (res) {
         e.dataQueryEvent(q);
       }
       return res;
     }

     setTimeout(() => {
       // Антидребезг. Если до сих пор те же лимит и оффсет, то загружаем
       if (this._lazyOffset_tmp === offset && this._lazyLimit_tmp === limit) {
         const res = this.check(q, offset, limit, reset);
         if (res) {
           e.dataQueryEvent(q);
         }
       }
     }, st.lazyLoadingPause);

     return true;
  }

  public reset() {
    if (this.settings.lazyLoading !== LazyLoadingMode.NONE) {
      this._queriedFrom = null;
      this._queriedTo = null;
      this.dataSource.totalRowCount = null;
      this.dataSource.lazyLoaded = null;
    }
  }

  private start() {
    this._loading = true;
  }

  private done() {
    this._loading = false;
  }

  public fetch(rows: any[], q: DataQuery, totalRowCount: number) {

    this.done();

    if (!rows) {
      return;
    }

    const ds = this.dataSource;
    const st = this.settings;

    if (!ds.model || q.resetData) {
      ds.model = [];
    }

    if (st.lazyLoading === LazyLoadingMode.INCREMENTAL) {
      // Incremental
      for (let i = 0; i < rows.length; i++) {
        ds.model[q.offset + i] = rows[i];
      }
      ds.lazyLoaded = ds.model.length;
    }

    if (st.lazyLoading === LazyLoadingMode.FRAGMENTARY) {
      // Fragmentary
      ds.lazyLoaded = ds.lazyLoaded === null ? 0 : ds.lazyLoaded;

      for (let i = 0; i < rows.length; i++) {
        const r = ds.model[q.offset + i];
        if (!r || r.__ax === 'empty') {
          ds.lazyLoaded++;
          ds.model[q.offset + i] = rows[i];
        }
      }
    }

    // Если каким-то чудом так получилось.. Нужно обрезать...
    if (ds.model.length > totalRowCount) {
      ds.model.length = totalRowCount;
    }
    ds.totalRowCount = totalRowCount;

    this.dataSource.accomplishFetch(ds.model);
  }

  /**
   * Не пора ли ленивенько подгрузить немного данных?
   * @param  q      DataQuery
   * @param  ds     Data source
   * @param  offset Current page offset
   * @param  limit  Current page limit
   * @param  reset  Reset loading because query has been changed.
   * @return        True if we need load data
   */
  public check(q: DataQuery, offset: number, limit: number, reset: boolean = false): boolean {

    if (reset) {
      this.reset();
    }

    if (this._loading) {
      // В процессе
      return false;
    }

    const ds = this.dataSource;
    const st = this.settings;

    const needRows = offset + limit + st.lazyLoadingThreshold;
    const total = ds.totalRowCount;
    const loaded = reset ? 0 : ds.loadedRowCount;

    // Если фрагментарный, то нужно искать наличие дырок
    let needToLoad = false;
    if (st.lazyLoading === LazyLoadingMode.INCREMENTAL) {
      needToLoad = total === null || (needRows > loaded && loaded < total);
    } else {
      needToLoad = loaded === 0;
      let i = offset - st.lazyLoadingThreshold;
      if (i < 0) {
        i = 0;
      }
      while (!needToLoad && i < (offset + limit)) {
        const r = ds.model[i];
        if (r === undefined || r.__ax === 'empty') {
          offset = i;
          needToLoad = true;
        }
        i++;
      }
    }

    if (needToLoad) {

      q.offset = st.lazyLoading === LazyLoadingMode.INCREMENTAL ? loaded : offset;
      q.limit = st.lazyLoadingPageSize + st.lazyLoadingThreshold;
      q.resetData = reset;
      if ((q.offset + q.limit) > this._queriedTo || q.offset < this._queriedFrom) {
        this._queriedFrom = q.offset;
        this._queriedTo = q.offset + q.limit;
        this.start();
        return true;
      }
    }
    return false;
  }
}
