import { AXPlatform } from '@acorex/core/platform';
import { AXLocalStorageService } from '@acorex/core/storage';
import { afterNextRender, Component, inject, isDevMode } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageService, ThemeService } from '@fe/services';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'health-club-mobile-app';
  private localStorageService = inject(AXLocalStorageService);
  private themeService = inject(ThemeService);
  platformService = inject(AXPlatform);
  languageService = inject(LanguageService);

  constructor() {
    afterNextRender(() => {
      this.languageService.init();
      const themeMode = localStorage.getItem('AX_THEME_MODE');
      if (!themeMode) {
        this.platformService.switchLightMode();
      } else {
        this.platformService.autoDetectThemeMode();
      }

      // if (!isDevMode) {
      //   this.updates.checkForUpdate().then((res) => {
      //     if (res) {
      //       this.doAppUpdate();
      //     }
      //   });
      // }
    });
  }

  setTheme(theme: string) {
    this.themeService.loadTheme(theme);
  }

  // doAppUpdate() {
  //   this.updates.activateUpdate().then(() => document.location.reload());
  // }
}
