// Copyright (C) 2018 Aleksey Melnikov
// This project is licensed under the terms of the MIT license.
// https://github.com/m-alx/yopsilon-mask

import { Internationalization } from "../src/internationalization/internationalization.class";
import { Locale } from "../src/internationalization/locale.class";

describe(`InternationalizationService: `, () => {

  let intl: Internationalization;
  let locale: Locale;

  beforeEach(function() {
    intl = new Internationalization();
    locale = {
        name: "Russian",
        shortName: "ru-RU",
        shortMonthNames: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл",
                          "Авг", "Сен", "Окт", "Ноя", "Дек"],

        longMonthNames:  ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                          "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь",
                          "Декабрь"],

        shortDayNames:   ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],

        longDayNames:    ["Воскресенье", "Понедельник", "Вторник", "Среда",
                          "Четверг", "Пятница", "Суббота"],

        firstDayOfWeek: 1,

        dateFormat: "dd.mm.yyyy",
        timeHMFormat: "HH:mi",
        timeHMSFormat: "HH:mi:ss",
        dateTimeHMFormat: "dd.mm.yyyy HH:mi",
        dateTimeHMSFormat: "dd.mm.yyyy HH:mi:ss",

        separators: [",", " "],
        currency: "{N1-12.2} ₽",

        translates: {'A': 'B'}
      };
  });

  afterEach(function() {
    intl.locales.splice(1, 1);
    intl.currentLocaleName = intl.locales[0].shortName;
  });

  it(`Current locale 1`, () => expect(intl.currentLocaleName).toBe('en-US'));
  it(`Current locale 2`, () => expect(intl.locale.name).toBe('English'));

  it(`Another locale`, () => {
    intl.addLocale(locale);
    intl.currentLocaleName = locale.shortName;
    expect(intl.locale.name).toBe('Russian');
  });

  it(`Another locale 2`, () => {
    intl.currentLocaleName = 'ru-RU';
    expect(intl.locale.name).toBe('English');
    intl.addLocale(locale);
    intl.currentLocaleName = 'ru-RU';
    expect(intl.locale.name).toBe('Russian');
  });

  it('Translate', () => {
    intl.addLocale(locale);
    intl.currentLocaleName = 'ru-RU';
    expect(intl.translate('A')).toBe('B');
  });
});
