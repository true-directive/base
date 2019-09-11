/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NumberFormat } from './number-format.class';
import { Keys } from '../common/keys.class';

export class NumberParserFormatter {

  // Split string to prefix, number and postfix
  public static unclotheNumber(txt: string, fmt: NumberFormat): any {

    if (fmt === null) {
      return { prefix: '', number: txt, postfix: '' };
    }

    let number = txt;

    let prefix = '';
    let postfix = '';

    const postfixL = fmt.postfix.length;
    if (number.substring(number.length - postfixL, number.length) === fmt.postfix) {
      postfix = fmt.postfix;
      number = number.substring(0, number.length - postfixL);
    }

    const prefixL = fmt.prefix.length;
    if (number.substring(0, prefixL) === fmt.prefix) {
      prefix = fmt.prefix;
      number = number.substring(prefixL, number.length);
    }

    return {
      prefix: prefix,
      number: number,
      postfix: postfix
    };
  }

  // Split number to parts
  public static splitNumber(txt: string, separators: Array<string>): any {

    let sgn = '';
    let e = '';
    const ei = txt.search(/e/i);
    if (ei >= 0) {
      e = txt[ei];
    }

    const exponentialParts = txt.split(/e/i);
    let significand: string = exponentialParts[0];
    const orderOfMagnitude: string = exponentialParts.length > 1 ? exponentialParts[1] : '';

    if (significand.length > 0 && '-+'.indexOf(significand[0]) >= 0) {
      sgn = significand[0];
      significand = significand.substring(1, txt.length);
    }

    const parts = significand.split(separators[0]);
    let decimalSeparator = ''; // Есть ли он?
    if (parts.length > 1) {
      decimalSeparator = significand[parts[0].length];
    }

    return {
      signum: sgn,
      int: parts[0],
      decimalSeparator: decimalSeparator,
      fraction: parts.length > 1 ? parts[1] : '',
      e: e,
      orderOfMagnitude: orderOfMagnitude
    };
  }

  // Round number to given number of decimals
  public static roundTo(v: number, decimals: number): number {
    return Math.round(v * Math.pow(10, decimals)) * Math.pow(10, -decimals);
  }

  // Format number with given format and separators
  public static format(value: number, format: string | NumberFormat, separators: Array<string>): string {

    let fmt: NumberFormat;
    if (format && typeof format === 'string') {
      fmt = NumberFormat.parseFormat(format);
      if (fmt === null) {
        throw new Error('Invalid format');
      }
    } else {
      fmt = <NumberFormat>format;
    }

    if (fmt.specifier.toLowerCase() === 'e') {
      // Exponential
    }

    let sgn = Math.sign(value) < 0 ? '-' : '';

    if (fmt.signum && sgn === '') {
      sgn = '+';
    }

    const num = NumberParserFormatter.roundTo(Math.abs(value), fmt.fractionMax).toFixed(fmt.fractionMax);
    const parts = num.split('.');

    let sInt = parts[0];
    let sFraction = parts.length > 1 ? parts[1] : '';

    // Remove trailing zeros
    while (sFraction.length > fmt.fractionMin && sFraction.substring(sFraction.length - 1) === '0') {
      sFraction = sFraction.substring(0, sFraction.length - 1);
    }

    // Add leading zeros
    while (sInt.length < fmt.intMin) {
      sInt = '0' + sInt;
    }

    // Thousand separators
    if (fmt.specifier.toLowerCase() === 'n' && separators.length > 1) {
      for (let i = 3; i < sInt.length; i += 4) {
        sInt = sInt.substring(0, sInt.length - i) + separators[1] + sInt.substring(sInt.length - i);
      }
    }

    let res = fmt.prefix + sgn + sInt;
    if (sFraction !== '') {
      res += separators[0] + sFraction;
    }

    res += fmt.postfix;
    return res;
  }

  // Parse number
  public static parse(txt: string, format: string, separators: Array<string>): any {

    const fmt: NumberFormat = NumberFormat.parseFormat(format);
    const parts = NumberParserFormatter.unclotheNumber(txt, fmt);

    if (parts.number === '') {
      return null;
    }

    const number = NumberParserFormatter.splitNumber(parts.number, separators);

    const thousandSeparator = separators.length > 1 ? separators[1] : '';
    const groups = thousandSeparator !== '' ? number.int.split(thousandSeparator) : number.int;

    let sgn = 1;
    if (number.signum === '-') {
      sgn = -1;
    }

    const int: number = +groups.join('');
    const fraction: number = number.fraction.length !== '' ? (+number.fraction) * Math.pow(10, -number.fraction.length) : 0;
    const resValue: number = sgn * (int + fraction) * Math.pow(10, number.orderOfMagnitude);

    return resValue;
  }

  public static canAcceptKey(txt: string, keyCode: number, char: string, format: string, separators: Array<string>,
    selStart: number, selEnd: number = -1,
    convertToFormat: boolean = false): boolean {

    // Можем принять цифру, если она после знака или знака нет
    const fmt: NumberFormat = NumberFormat.parseFormat(format);

    const parts = NumberParserFormatter.unclotheNumber(txt, fmt);

    const number = NumberParserFormatter.splitNumber(parts.number, separators);

    const numStart = parts.prefix.length;
    const numEnd = parts.prefix.length + parts.number.length;

    const intStart = numStart + number.signum.length;
    const intEnd = intStart + number.int.length;
    const fractionStart =  intEnd + number.decimalSeparator.length;

    const eStart = fractionStart + number.fraction.length;

    if (keyCode === Keys.DELETE) {
      // Нельзя удалить десятичный разделитель
      if (convertToFormat && selStart === selEnd && selStart === fractionStart - 1) {
        return false;
      }

      if (selStart >= numEnd) {
        return false;
      }
      return true;
    }

    if (keyCode === Keys.BACKSPACE) {
      // Запрет применения, если последний ноль забирается...
      if (convertToFormat && number.int === '0'
          && selStart === (numStart + number.signum.length)
          && selEnd === (numStart + number.signum.length + 1)
        ) {
        return false;
      }

      if (selStart > numEnd) {
        return false;
      }

      if (convertToFormat && number.int === '0' && selStart === selEnd && selStart === (numStart + number.signum.length + 1)) {
        return false;
      }

      // Запрет применения, если удаляется десятичный разделитель
      if (convertToFormat && selStart === selEnd && selStart === fractionStart) {
        return false;
      }

      return true;
    }

    // Знак
    if ('+-'.indexOf(char) >= 0) {
      // Можно применить только в двух случаях

      // 1. Знака не было и мы в начале строки
      if (number.signum === '' && selStart === numStart) {
        return true;
      }

      // 2. После E
      if (number.e !== '') {
        const omStart = eStart + number.e.length;
        if (selStart === omStart) {
          return true;
        }
      }
    }

    // Формат подразумевает экспоненциальную форму
    if (char.toLowerCase() === 'e' && fmt.specifier.toLowerCase() === 'e') {
      if (selStart === eStart) {
        return true;
      }
    }

    // Десятичный разделитель
    if (separators.length > 0 && char === separators[0] && fmt.fractionMax > 0) {

      // Только если заменяем разделитель
      const dmStart = numStart + number.signum.length + number.int.length;
      if (selStart === dmStart) {
        return true;
      }

      // Нету еще разделителя
      if (number.decimalSeparator === '') {
        return true;
      }
    }

    // Цифра
    if ('0123456789'.indexOf(char) >= 0) {

      // Нельзя  до минуса
      if (number.signum !== '' && selStart <= numStart) {
        return false;
      }

      // И до префикса
      if (selStart < numStart) {
        return false;
      }

      if (selStart > numEnd) {
        return false;
      }

      // Исчерпано количество знаков целой части
      if (selStart >= intStart && selStart <= intEnd
          && number.int.split(separators[1]).join('').length >= fmt.intMax) {
        return false;
      }

      // Исчерпано количество знаков после запятой
      // Десятичный сепаратор есть
      if (selStart === eStart && number.fraction.length >= fmt.fractionMax && number.decimalSeparator !== '') {
        return false;
      }
      return true;
    }
    return false;
  }

  // Переформатирование числового значения
  public static reformat(txt: string, format: string, separators: Array<string>,
    selStart: number, selEnd: number,
    convertToFormat: boolean = false): any {

    if (txt === '') {
      return { value: '', selStart: 0, selEnd: 0, canInput: true };
    }

    const fmt: NumberFormat = NumberFormat.parseFormat(format);

    const parts = NumberParserFormatter.unclotheNumber(txt, fmt);
    const number = NumberParserFormatter.splitNumber(parts.number, separators);

    const decimalSeparator = separators[0];
    const thousandSeparator = separators[1];

    let newSelStart = selStart - parts.prefix.length - number.signum.length;
    let newSelEnd = selEnd - parts.prefix.length - number.signum.length;

    // ЦЕЛАЯ ЧАСТЬ
    // Убираем лидирующие нули
    while (number.int.length > 1 && number.int[0] === '0') {
      number.int = number.int.substring(1);
      if (newSelStart > 0) {
        newSelStart--;
      }
      if (newSelEnd > 0) {
        newSelEnd--;
      }
    }

    // Список групп
    const groups = number.int.split(thousandSeparator);

    // Вычитаем из позиции курсора количество разделителей тысяч, которые наскреблись до курсора..
    let pos = groups[0].length;

    // Первую группу пропускаем
    let ss = newSelStart;
    let se = newSelEnd;
    for (let i = 1; i < groups.length; i++) {

      if (newSelStart > pos) {
        ss -= thousandSeparator.length;
      }
      if (newSelEnd > pos) {
        se -= thousandSeparator.length;
      }
      pos += groups[i].length + thousandSeparator.length;
    }

    newSelStart = ss;
    newSelEnd = se;

    // Составляем целую часть из групп
    number.int = groups.join('');

    if (fmt.specifier.toLowerCase() === 'n') {
      for (let i = 3; i < number.int.length; i += 4) {

        // Необходимо добавить курсору немного позиции, если он стоит дальше этого разделителя...
        if (newSelStart > (number.int.length - i)) {
          newSelStart += thousandSeparator.length;
        }

        if (newSelEnd > (number.int.length - i)) {
          newSelEnd += thousandSeparator.length;
        }

        number.int = number.int.substring(0, number.int.length - i) +
                         thousandSeparator +
                         number.int.substring(number.int.length - i);
      }
    }

    // Добавляем лидирующие нули
    if (!convertToFormat && number.int === '' && number.fraction !== '') {
      number.int = '0';
      newSelStart++;
      newSelEnd++;
    }

    if (convertToFormat && fmt !== null && (number.signum !== '' || number.int !== '' || number.fraction !== '')) {
      while (number.int.length < fmt.intMin) {
        number.int = '0' + number.in5;
        newSelEnd++;
      }
    }

    // Fraction
    // Remove thousand separators
    number.fraction = number.fraction.replace(thousandSeparator, '');

    // Добавляем до минимума
    if (convertToFormat && fmt !== null && (number.int !== '' || number.signum !== '')) {
      while (number.fraction.length < fmt.fractionMin) {
        number.fraction += '0';
      }
    }

    // Убираем лишние знаки
    number.fraction = number.fraction.substring(0, fmt.fractionMax);

    // ИТОГОВОЕ ЗНАЧЕНИЕ
    let resValue = fmt.prefix;
    newSelStart += resValue.length;
    newSelEnd += resValue.length;

    if (number.signum !== '') {
      resValue += number.signum;
      newSelStart += number.signum.length;
      newSelEnd += number.signum.length;
    }

    resValue += number.int;

    if (convertToFormat) {
      if (number.fraction !== '') {
        resValue += separators[0] + number.fraction;
      }
    } else {
      // Не нужно приводить к формату... Добавляем разделитель только если он был в исходном значении
      if (txt.indexOf(separators[0]) >= 0) {
        resValue += separators[0] + number.fraction;
      }
    }

    if (fmt.specifier.toLowerCase() === 'e') {
      resValue += number.e;
      resValue += number.orderOfMagnitude;
    }

    resValue += fmt.postfix;

    // Возвращаем
    const result = { value: resValue, selStart: newSelStart, selEnd: newSelEnd };
    return result;
  }
}
