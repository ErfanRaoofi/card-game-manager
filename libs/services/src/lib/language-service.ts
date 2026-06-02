import { AXLocaleService } from '@acorex/core/locale';
import { AXPlatform } from '@acorex/core/platform';
import { AXLocalStorageService } from '@acorex/core/storage';

import { HttpClient } from '@angular/common/http';
import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FontService } from './font-service';

export type AXLang = 'en' | 'fa' | 'ar' | 'pa' | 'tr' | 'ru';
export type AXLangLocale = 'en-US' | 'fa-IR' | 'fa-AF' | 'ar-AE' | 'tr-TR' | 'ru-RU';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  router = inject(Router);
  fontService = inject(FontService);

  http = inject(HttpClient);
  document = inject(DOCUMENT);
  platform = inject(AXPlatform);
  localeService = inject(AXLocaleService);
  localStorage = inject(AXLocalStorageService);

  locale$ = new BehaviorSubject<AXLangLocale>(this.getLocale());

  private fontFamilies: any = {
    en: 'Inter, Vazirmatn FD',
    fa: 'Vazirmatn FD, Inter',
    pa: 'Vazirmatn FD, Inter',
    ar: 'noto-sans-arabic, Inter',
    tr: 'Inter',
    ru: 'Inter',
  };

  direction = signal<'ltr' | 'rtl'>(this.getLocale() === 'fa-IR' ? 'rtl' : 'ltr');

  init() {
    const locale = this.localStorage.get<AXLangLocale>('AX_LANG');
    // if (locale) {
    this.switchLang(this.getLangFromLocale(locale));
    // this.fontService.init();
    // }
  }

  getLocale(): AXLangLocale {
    const locale = this.getLocaleFromLocalStorage();
    if (locale) {
      return locale;
    } else {
      return 'en-US';
    }
    // const currentUrl = this.router.url;
    // const urlParts = currentUrl.split('/');
    // const locales: AXLangLocale[] = ['en-US', 'fa-IR', 'ar-EG', 'zh-CN'];
    // if (urlParts.length > 1 && locales.includes(urlParts[1] as AXLangLocale)) {
    //   return urlParts[1] as AXLangLocale;
    // }
    // return locales[0];
  }

  switchLang(lang: AXLang) {
    let newLocale: AXLangLocale;
    switch (lang) {
      case 'fa':
        this.document.documentElement.setAttribute('lang', 'fa');
        this.document.documentElement.setAttribute('dir', 'rtl');
        this.direction.set('rtl');
        this.localStorage.set('AX_LANG', 'fa-IR');
        newLocale = 'fa-IR';
        document.body.style.fontFamily = this.fontFamilies[lang];
        break;
      case 'pa':
        this.document.documentElement.setAttribute('lang', 'pa');
        this.document.documentElement.setAttribute('dir', 'rtl');
        this.direction.set('rtl');
        this.localStorage.set('AX_LANG', 'fa-AF');
        newLocale = 'fa-AF';
        document.body.style.fontFamily = this.fontFamilies[lang];
        break;
      case 'ar':
        this.document.documentElement.setAttribute('lang', 'ar');
        this.document.documentElement.setAttribute('dir', 'rtl');
        this.direction.set('rtl');
        this.localStorage.set('AX_LANG', 'ar-AE');
        newLocale = 'ar-AE';
        document.body.style.fontFamily = this.fontFamilies[lang];
        break;
      case 'tr':
        this.document.documentElement.setAttribute('lang', 'tr');
        this.document.documentElement.setAttribute('dir', 'ltr');
        this.direction.set('ltr');
        this.localStorage.set('AX_LANG', 'tr-TR');
        newLocale = 'tr-TR';
        document.body.style.fontFamily = this.fontFamilies[lang];
        break;
      case 'ru':
        this.document.documentElement.setAttribute('lang', 'ru');
        this.document.documentElement.setAttribute('dir', 'ltr');
        this.direction.set('ltr');
        this.localStorage.set('AX_LANG', 'ru-RU');
        newLocale = 'ru-RU';
        document.body.style.fontFamily = this.fontFamilies[lang];
        break;
      case 'en':
      default:
        this.document.documentElement.setAttribute('lang', 'en');
        this.document.documentElement.setAttribute('dir', 'ltr');
        this.direction.set('ltr');
        this.localStorage.set('AX_LANG', 'en-US');
        newLocale = 'en-US';
        document.body.style.fontFamily = this.fontFamilies[lang];
        break;
    }

    if (newLocale) {
      this.locale$.next(newLocale);
      //   const currentUrl = this.router.url;
      //   const urlParts = currentUrl.split('/');
      //   const locales: AXLangLocale[] = ['en-US', 'fa-IR', 'ar-EG', 'zh-CN'];
      //   if (urlParts.length > 1 && locales.includes(urlParts[1] as AXLangLocale)) {
      //     urlParts[1] = newLocale;
      //     this.router.navigateByUrl(urlParts.join('/'));
      //   }
      console.log(newLocale);

      this.localeService.setProfile(newLocale);
      this.localeService.setProfile(newLocale);

      // if (type === 'userChange') {

      //   location.reload();
      // }
    }
  }

  getLocaleFromLocalStorage(): AXLangLocale | null {
    const locale = this.localStorage.get<AXLangLocale>('AX_LANG');
    if (locale) {
      return locale;
    }
    return null;
  }

  getLangFromLocale(locale: AXLangLocale): AXLang {
    switch (locale) {
      case 'en-US':
        return 'en';
      case 'fa-IR':
        return 'fa';
      case 'fa-AF':
        return 'pa';
      case 'ar-AE':
        return 'ar';
      case 'tr-TR':
        return 'tr';
      case 'ru-RU':
        return 'ru';
      default:
        return 'en';
    }
  }

  getLocaleFromLang(lang: AXLang): AXLangLocale {
    switch (lang) {
      case 'en':
        return 'en-US';
      case 'fa':
        return 'fa-IR';
      case 'pa':
        return 'fa-AF';
      case 'ar':
        return 'ar-AE';
      case 'tr':
        return 'tr-TR';
      case 'ru':
        return 'ru-RU';
      default:
        return 'en-US';
    }
  }
}
