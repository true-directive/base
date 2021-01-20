/**
 * Custom framework-independent injection
 */
export function AxInject(name?: string): Function {
    return (target: any, pKey: string, descr: PropertyDescriptor) => {
        // Сохраняем в список в target о необходимости их
        // инициализации.
        // В конструкторе всё делаем
        if (!target['__ax_hta']) {
          const a: {[id: string]: any} = {};
          a[name] = pKey;
          target['__ax_hta'] = a;
        } else {
          target['__ax_hta'][name] = pKey;
        }
    };
}
