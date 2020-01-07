/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { DataSource } from './datasource.class';
import { DataQuery } from './data-query.class';
import { GridSettings } from './grid-settings.class';
import { LazyLoadingMode } from './enums';

export class LazyLoader {

  private _queriedFrom?: number = null;
  private _queriedTo?: number = null;

  private _loading = false;

  public reset(ds: DataSource) {
    this._queriedFrom = null;
    this._queriedTo = null;
    ds.totalRowCount = null;
    ds.lazyLoaded = null;
  }

  private start() {
    this._loading = true;
  }

  private done() {
    this._loading = false;
  }

  public fetch(rows: any[], st: GridSettings, q: DataQuery, ds: DataSource, totalRowCount: number) {

    this.done();

    if (!rows) {
      return;
    }

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
  }

  public checkLazy(st: GridSettings, q: DataQuery, ds: DataSource,
                  offset: number, limit: number, reset: boolean = false): boolean {

    if (reset) {
      this.reset(ds);
    }

    if (this._loading) {
      return false;
    }

    const needRows = offset + limit + st.lazyLoadingThreshold;
    const total = ds.totalRowCount;
    const loaded = reset ? 0 : ds.loadedRowCount;

    // Если фрагментарный, то нужно искать наличие дырок
    let needToLoad = false;
    if (st.lazyLoading === LazyLoadingMode.INCREMENTAL) {
      needToLoad = total === null || (needRows > loaded && loaded < total);
    } else {
      needToLoad = loaded == 0;
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
