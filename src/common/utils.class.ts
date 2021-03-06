/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class Utils {

  /**
   * Is the element ancestor to the given element.
   * @param  ancestor Element to check.
   * @param  element  An element that may be descendant
   * @return          True if the first element is an ancestor of the second element.
   */
  public static isAncestor(ancestor: any, element: any): boolean {
    if (!element) {
      return false;
    }
    var parent = element;
    while (parent && parent !== ancestor) {
      parent = parent.parentNode;
    }
    return parent === ancestor;
  }

  /**
   * Is given element has ancestor with given css-class
   * @param  element Element to check
   * @param  ancestorClass  class
   * @return  True if the first element has an ancestor with given class.
   */
  public static isClassDescendant(element: any, ancestorClass: string): boolean {
    if (!element) {
      return false;
    }
    var parent = element;
    while (parent) {
      if (parent && parent.classList && parent.classList.contains(ancestorClass)) {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  }

  /**
   * Moving item inside the array.
   * @param  arr      Array.
   * @param  oldIndex Old index.
   * @param  newIndex New index.
   */
  public static moveArrayItem(arr: any[], oldIndex: number, newIndex: number) {
    if (newIndex >= arr.length) {
      let k = newIndex - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  }

  /**
   * Removes html tags from the string.
   * @param  txt String to remove tags
   * @return     String without tags.
   */
  public static htmlToPlaintext(txt: string): string {
    let re = new RegExp('<[^>]+>', 'gm');
    return txt ? String(txt).replace(re, '') : '';
  }

  public static get userAgent(): string {
    return navigator.userAgent || navigator.vendor;
  }

  public static detectIOS(): boolean {
    const re = new RegExp('iPad|iPhone|iPod');
    return re.test(Utils.userAgent);
  }

  public static detectFirefox(): boolean {
    return Utils.userAgent.toLowerCase().indexOf('firefox') > -1;
  }

  public static detectSafari(): boolean {
    const safari = Utils.userAgent.toLowerCase().indexOf('safari');
    const chrome = Utils.userAgent.toLowerCase().indexOf('chrome');
    return safari > -1 && chrome <= -1;
  }

  public static detectAndroid(): boolean {
    const re = new RegExp('android', 'i');
    return re.test(Utils.userAgent);
  }

  public static detectMobile(): boolean {
    return Utils.detectIOS() || Utils.detectAndroid();
  }

  public static detectIE(): boolean {
    // Does not include EDGE
    const re = new RegExp('MSIE|Trident', 'i');
    return re.test(Utils.userAgent);
  }

  /**
   *  Returns date if it is valid or null if not.
   */
  public static purifyDate(v: any): any {
    if (v === undefined || v === null || isNaN(v.getTime())) {
      return null;
    }
    return v;
  }
}
