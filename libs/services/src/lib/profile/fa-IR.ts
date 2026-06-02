import { AXLocaleProfile } from '@acorex/core/locale';

export const AXIRLocaleProfile: AXLocaleProfile = {
  localeInfo: {
    code: 'fa-IR',
    language: 'fa',
    region: 'IR',
    timezone: 'Asia/Tehran',
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
      short: 'YY/MM/DD',
      medium: 'YYYY/MM/DD',
      long: 'dddd، D MMMM YYYY',
      full: 'dddd، D MMMM YYYY',
    },
    time: {
      short: 'HH:mm',
      medium: 'HH:mm:ss',
      long: 'HH:mm:ss Z',
      full: 'HH:mm:ss ZZZZ',
    },
    datetime: {
      short: 'YY/MM/DD HH:mm',
      medium: 'YYYY/MM/DD HH:mm:ss',
      long: 'dddd، D MMMM YYYY HH:mm:ss Z',
      full: 'dddd، D MMMM YYYY HH:mm:ss ZZZZ',
    },
    numbers: {
      decimalPattern: '1٬000٫00',
      currency: {
        code: 'IRR',
      },
    },
    contacts: {
      phone: '09XX XXX XXXX',
      postalCode: 'XXXXX-XXXXX',
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
    fallbackLocales: ['en-US'],
    supportedLanguages: ['fa-IR', 'en-US'],
  },
};
