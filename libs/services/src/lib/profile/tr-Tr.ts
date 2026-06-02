import { AXLocaleProfile } from '@acorex/core/locale';

export const AXTRLocaleProfile: AXLocaleProfile = {
    localeInfo: {
        code: 'tr-TR',
        language: 'tr',
        region: 'TR',
        timezone: 'Europe/Istanbul',
    },

    calendar: {
        system: 'gregorian',
        week: {
            startsOn: 1,          // دوشنبه
            weekends: [6, 0],     // شنبه و یکشنبه
        },
        clock: {
            format24Hour: true,  // 24 ساعته (رایج در ترکیه)
        },
    },

    formats: {
        date: {
            short: 'dd.MM.yyyy',
            medium: 'dd MMM yyyy',
            long: 'd MMMM yyyy',
            full: 'EEEE, d MMMM yyyy',
        },
        time: {
            short: 'HH:mm',
            medium: 'HH:mm:ss',
            long: 'HH:mm:ss z',
            full: 'HH:mm:ss zzzz',
        },
        datetime: {
            short: 'dd.MM.yyyy HH:mm',
            medium: 'dd MMM yyyy HH:mm:ss',
            long: 'd MMMM yyyy HH:mm:ss z',
            full: 'EEEE, d MMMM yyyy HH:mm:ss zzzz',
        },
        numbers: {
            decimalPattern: '1.000,00',
            currency: {
                code: 'TRY',
            },
        },
        contacts: {
            phone: '05XX XXX XX XX',
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
        rtl: false,                       // ✅ LTR
        fallbackLocales: ['en-TR'],
        supportedLanguages: ['tr-TR', 'en-TR'],
    },
};
