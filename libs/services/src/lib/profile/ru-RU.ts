import { AXLocaleProfile } from '@acorex/core/locale'

export const AXRULocaleProfile: AXLocaleProfile = {
    localeInfo: {
        code: 'ru-RU',
        language: 'ru',
        region: 'RU',
        timezone: 'Europe/Moscow',
    },
    calendar: {
        system: 'gregorian',
        week: {
            startsOn: 1,          // دوشنبه
            weekends: [6, 0],     // شنبه و یکشنبه
        },
        clock: {
            format24Hour: true,
        },
    },
    formats: {
        date: {
            short: 'DD.MM.yyyy',
            medium: 'D MMM yyyy',
            long: 'D MMMM yyyy',
            full: 'EEEE, D MMMM yyyy',
        },
        time: {
            short: 'HH:mm',
            medium: 'HH:mm:ss',
            long: 'HH:mm:ss Z',
            full: 'HH:mm:ss ZZZZ',
        },
        datetime: {
            short: 'DD.MM.yy HH:mm',
            medium: 'DD.MM.yyyy HH:mm:ss',
            long: 'D MMMM yyyy HH:mm:ss Z',
            full: 'EEEE, D MMMM yyyy HH:mm:ss ZZZZ',
        },
        numbers: {
            decimalPattern: '1 000,00',
            currency: {
                code: 'RUB',
            },
        },
        contacts: {
            phone: '+7 XXX XXX-XX-XX',
            postalCode: 'XXXXXX',
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
        rtl: false,
        fallbackLocales: ['en-RU'],
        supportedLanguages: ['ru-RU', 'en-RU'],
    },
}
