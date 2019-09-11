// Copyright (C) 2018 Aleksey Melnikov
// This project is licensed under the terms of the MIT license.

import { NumberParserFormatter } from '../src/numbers/number-parser-formatter.class';
import { Keys } from '../src/common/keys.class';
const intStr = '2019';
const intFmt = '{0-4}';

const testStr1 = '$123,456,789.01';
const testStr2 = '-1.2345e+6';
const testStr3 = '123 456,78 РУБ';
const testStr4 = '12,345.00';

const testFmt1 = '${1.2}';
const testFmt2 = '';
const testFmt3 = '{1.2} РУБ';
const testFmt4 = '{1.2}';

describe(`Parse integer value ` + intStr, () => {
  let v = NumberParserFormatter.parse(intStr, intFmt, ['.',',']);
  it(`Value = 2019'`, () => expect(v).toBe(2019));
});

describe(`Format integer value ` + intStr, () => {
  let v = NumberParserFormatter.format(2019, intFmt, ['.',',']);
  it(`Value = 2019'`, () => expect(v).toBe('2019'));
});

describe(`Parse ` + testStr1, () => {
  let v = NumberParserFormatter.parse(testStr1, testFmt1, ['.',',']);
  it(`Value = 123,456,789.01'`, () => expect(v).toBe(123456789.01));
});

describe(`Parse ` + testStr4, () => {

  let v = NumberParserFormatter.parse(testStr4, testFmt4, ['.',',']);
  it(`Value = 12345.00'`, () => expect(v).toBe(12345.00));
});

describe(`Parse ` + testStr2, () => {
  let v: number = NumberParserFormatter.parse(testStr2, '', ['.',',']);
  it(`Value = ` + testStr2, () => expect(v).toBe(-1.2345e+6));
});

describe(`Parse ` + testStr3, () => {

  let v: number = NumberParserFormatter.parse(testStr3, testFmt3, [',',' ']);
  it(`Value = ` + testStr3, () => expect(v).toBe(123456.78));
});

describe(`Parse empty string`, () => {

  let v: number = NumberParserFormatter.parse('', testFmt3, [',',' ']);
  it(`Value = null`, () => expect(v).toBeNull());
});

describe(`Format ` + testStr1, () => {
  let v = 123456789.1;
  let s: string = NumberParserFormatter.format(v, '{N1.3-4}', ['.',',']);
  it(v + ` with {1.3-4} = ` + testStr3, () => expect(s).toBe('123,456,789.100'));
});

describe(`Format ` + testStr1, () => {
  let v = 123456789.245;
  let s: string = NumberParserFormatter.format(v, '{+N1.2}', ['.',',']);
  it(v + ` with {1.2} = '123,456,789.25'`, () => expect(s).toBe('+123,456,789.25'));
});

describe(`Format ` + testStr1, () => {
  let v = -123456789.245;
  let s: string = NumberParserFormatter.format(v, '{N1.2}', ['.',',']);
  it(v + ` with {1.2} = '-123,456,789.25'`, () => expect(s).toBe('-123,456,789.25'));
});

describe(`Format 0`, () => {
  let v = 0;
  let s: string = NumberParserFormatter.format(v, '{1.3-4}', ['.',',']);
  it(v + ` with {1.3-4} = 0.000`, () => expect(s).toBe('0.000'));
});

describe(`Format int value`, () => {
  let v = 123;
  let s: string = NumberParserFormatter.format(v, '{1.0-4}', ['.',',']);
  it(v + ` with {1.0-4} = 0`, () => expect(s).toBe('123'));
});

describe(`Reformat int value`, () => {
  let s = '1';
  let state: any;
  if (NumberParserFormatter.canAcceptKey('', null, '1', '{1-4}', ['.',','], 0, 0))
    state = NumberParserFormatter.reformat(s, '{1-4}', ['.',','], 0, 0);
  it(s + ` with {n1-4} = '1'`, () => expect(state.value).toBe('1'));
});

describe(`Reformat ` + testStr1, () => {
  let s = '-123456789.25';
  let state: any = NumberParserFormatter.reformat(s, '{n1.2}', ['.',','], 0, 0);
  it(s + ` with {n1.2} = '-123,456,789.25'`, () => expect(state.value).toBe('-123,456,789.25'));
});

describe(`Reformat ` + testStr1, () => {
  let s = '-123456789.25';
  let state: any = NumberParserFormatter.reformat(s, '{n1.2}', ['.',','], 0, 0);
  it(s + ` with {n1.2} = '1,123,123,123,123.25'`, () => expect(state.value).toBe('-123,456,789.25'));
});

describe(`Reformat after backspace: ` + testStr1, () => {
  let s = '1,312,312,311,231,23.00';
  let state: any = NumberParserFormatter.reformat(s, '{n1.2}', ['.',','], 20, 0);
  it(s + ` = '131,231,231,123,123.00'`, () => expect(state.value).toBe('131,231,231,123,123.00'));
  it('Cursor position = ', () => expect(state.selStart).toBe(19));
});

describe(`Reformat after decimal point insert `, () => {
  let s = '123,12.3,123';
  let state: any = NumberParserFormatter.reformat(s, '{n1.2-4}', ['.',','], 0, 0);
  it(s + ` with {n1.2-4} = '12,312.3123'`, () => expect(state.value).toBe('12,312.3123'));
});

describe(`Can accept decimal point if it already exists`, () => {
  let s = '123.4';
  let res: boolean = NumberParserFormatter.canAcceptKey(s, -1, '.', '{N1-4.1}', ['.',','], 1, 1);
  it('Result must be falsy', () => expect(res).toBeFalsy());
});

describe(`Can accept digit in postfix`, () => {
  let s = '123.4 kg';
  let res: boolean = NumberParserFormatter.canAcceptKey(s, -1, '1', '{N1-4.1} kg', ['.',','], 8, 8);
  it('Result must be falsy', () => expect(res).toBeFalsy());
});

describe(`Can accept DELETE in postfix`, () => {
  let s = '123.4 kg';
  let res: boolean = NumberParserFormatter.canAcceptKey(s, Keys.DELETE, '', '{N1-4.1} kg', ['.',','], 8, 8);
  it('Result must be falsy', () => expect(res).toBeFalsy());
});

describe(`Can accept BACKSPACE in postfix`, () => {
  let s = '123.4 kg';
  let res: boolean = NumberParserFormatter.canAcceptKey(s, Keys.BACKSPACE, '', '{N1-4.1} kg', ['.',','], 8, 8);
  it('Result must be falsy', () => expect(res).toBeFalsy());
});

describe(`Can accept BACKSPACE in number`, () => {
  let s = '123.4 kg';
  let res: boolean = NumberParserFormatter.canAcceptKey(s, Keys.BACKSPACE, '', '{N1-4.1} kg', ['.',','], 5, 5);
  it('Result must be truthy', () => expect(res).toBeTruthy());
});
