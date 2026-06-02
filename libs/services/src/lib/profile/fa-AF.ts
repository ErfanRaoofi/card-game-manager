import { AXLocaleProfile } from '@acorex/core/locale';

export const AXAFGregorianLocaleProfile: AXLocaleProfile = {
  localeInfo: {
    code: 'fa-AF',
    language: 'fa',
    region: 'AF',
    timezone: 'Asia/Kabul',
  },

  calendar: {
    system: 'gregorian', // میلادی
    week: {
      startsOn: 6, // شنبه
      weekends: [4, 5], // پنجشنبه و جمعه
    },
    clock: {
      format24Hour: true, // 24 ساعته
    },
  },

  formats: {
    date: {
      short: 'DD/MM/yyyy',
      medium: 'D MMM yyyy',
      long: 'EEEE، D MMMM yyyy',
      full: 'EEEE، D MMMM yyyy',
    },
    time: {
      short: 'HH:mm',
      medium: 'HH:mm:ss',
      long: 'HH:mm:ss Z',
      full: 'HH:mm:ss ZZZZ',
    },
    datetime: {
      short: 'DD/MM/yyyy HH:mm',
      medium: 'D MMM yyyy HH:mm:ss',
      long: 'EEEE، D MMMM yyyy HH:mm:ss Z',
      full: 'EEEE، D MMMM yyyy HH:mm:ss ZZZZ',
    },
    numbers: {
      decimalPattern: '1٬000٫00',
      currency: {
        code: 'AFN', // افغانی
      },
    },
    contacts: {
      phone: '07X XXX XXX',
      postalCode: 'XXXXX',
    },
  },

  units: {
    temperature: 'celsius',
    distance: 'kilometers',
    weight: 'kilograms',
    volume: 'liters',
    speed: 'kmh',
    area: 'square-meters',
  },

  i18nMeta: {
    rtl: true,
    fallbackLocales: ['en-AF', 'fa-IR'],
    supportedLanguages: ['fa-AF', 'en-AF'],
  },
};
