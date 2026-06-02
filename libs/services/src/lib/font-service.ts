import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class FontService {
  private router = inject(Router);
  private fontFamilies: any = {
    en: 'BalooDa',
    fa: 'Vazirmatn FD, sans-serif',
  };

  getFontFamily() {
    const lang = this.router.url.split('/')[1];
    return this.fontFamilies[lang] || 'Vazirmatn FD';
  }

  init() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const fontFamily = this.getFontFamily();
        document.body.style.fontFamily = fontFamily;
      }
    });
  }
}
