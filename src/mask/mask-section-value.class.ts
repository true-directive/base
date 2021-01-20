export class MaskSectionValue {

  public beforeChars: string;
  public currentChar: string;
  public afterChars: string;

  public append(s: string) {
    this.afterChars += s;
  }

  public value(newChar: string = null) {
    if (newChar !== null) {
      return this.beforeChars + newChar + this.afterChars;
    } else {
      return this.beforeChars + this.currentChar + this.afterChars;
    }
  }

  public get length() {
    return this.value().length;
  }

  constructor(value: string, sectionPos: number, selStart: number) {

    const selStart_local = selStart - sectionPos;

    if (selStart_local < 0 || selStart_local > value.length) {
      this.beforeChars = value;
      this.currentChar = '';
      this.afterChars = '';
      return;
    }

    this.beforeChars = value.substring(0, selStart_local);
    this.currentChar = value.substring(selStart_local, selStart_local + 1);
    this.afterChars = value.substring(selStart_local + 1);
  }
}
