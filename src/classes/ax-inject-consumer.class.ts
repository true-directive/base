/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/**
 * Custom injection consumer
 */
export class AxInjectConsumer {
  [key: string]: any;
  public handlers: { [id: string]: any };
  public __ax_hta: { [id: string]: any };

  protected updateInjections() {
    const registeredHandlers: { [id: string]: any } =  this['handlers'];
    const handlers: { [id: string]: any } = this.__ax_hta;

    Object.keys(handlers).forEach((key: any) => {
      const h: any = registeredHandlers[key];
      const prop: string = handlers[key];
      if (h && !this[prop]) {
        this[prop] = new h();
      }
    });

    Object.keys(handlers).forEach((key: any) => {
      const prop: string = handlers[key];
      // Это детки текущего
      const h: any = this[prop];
      if (h && h['__ax_hta']) {
        Object.keys(h['__ax_hta']).forEach(childKey => {
          // Это детки этого дитятки
            const prop2: string = h['__ax_hta'][childKey];
            const prop3: string = this['__ax_hta'][childKey];
            h[prop2] = this[prop3];
        });
      }
    });
  }
}
