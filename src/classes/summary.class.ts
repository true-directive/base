/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class SummaryType {
  static SUM = new SummaryType('Sum', 'Sum', 'SUM');
  static MIN = new SummaryType('Minimum', 'Min', 'MIN');
  static MAX = new SummaryType('Maximum', 'Max', 'MAX');
  static COUNT = new SummaryType('Count', 'Count', 'TOTAL');
  static AVERAGE = new SummaryType('Average', 'Avg', 'AVG');
  constructor(public name: string, public shortName: string, public footerText: string) { }
}

export class Summary {
  constructor(public type: SummaryType) { }
  public value: any;
}
