import { AXLocaleProfile } from '@acorex/core/locale'

export const AXAELocaleProfile: AXLocaleProfile = {
    localeInfo: {
        code: 'ar-AE',
        language: 'ar',
        region: 'AE',
        timezone: 'Asia/Dubai',
    },
    calendar: {
        system: 'gregorian',
        week: {
            startsOn: 6,          // شنبه
            weekends: [5, 6],    // جمعه و شنبه (استاندارد جدید امارات)
        },
        clock: {
            format24Hour: true,
        },
    },
    formats: {
        date: {
            short: 'DD-MM-yyyy',
            medium: 'DD/MM/yyyy',
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
            short: 'DD/MM/yy HH:mm',
            medium: 'DD/MM/yyyy HH:mm:ss',
            long: 'EEEE، D MMMM yyyy HH:mm:ss Z',
            full: 'EEEE، D MMMM yyyy HH:mm:ss ZZZZ',
        },
        numbers: {
            decimalPattern: '1٬000٫00',
            currency: {
                code: 'AED',
            },
        },
        contacts: {
            phone: '05X XXX XXXX',
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
        fallbackLocales: ['en-AE'],
        supportedLanguages: ['ar-AE', 'en-AE'],
    },
};
