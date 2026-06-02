import { AXHotkeysService } from '@acorex/cdk/common';
import { AXDialogService } from '@acorex/components/dialog';
import { AXLoadingService } from '@acorex/components/loading';
import { AXPopupService } from '@acorex/components/popup';
import { AXToastService } from '@acorex/components/toast';
import { AX_DATETIME_CONFIG, dateTimeConfig } from '@acorex/core/date-time';
import { AX_LOCALSTORAGE_SECRET_KEY, AXLocalStorageService } from '@acorex/core/storage';
import { AX_TRANSLATION_CONFIG, AX_TRANSLATION_LOADER, translationConfig } from '@acorex/core/translation';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AuthService, configureAppApi } from '@fe/services';
import { environment } from '../environments/environment';
import { AppTranslationLoader } from './app.loaders';
import { appRoutes } from './app.routes';
import { AXFormatModule } from '@acorex/core/format';
import { AXValidationModule } from '@acorex/core/validation';

configureAppApi(environment.apiBaseUrl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(appRoutes),
    AXPopupService,
    AXToastService,
    AXLoadingService,
    AXDialogService,
    AXHotkeysService,
    AXFormatModule,
    AXValidationModule,
    provideAppInitializer(() => inject(AuthService).initSession()),
    {
      provide: AX_DATETIME_CONFIG,
      useValue: dateTimeConfig({
        calendar: 'solar-hijri',
      }),
    },
    {
      provide: AXLocalStorageService,
    },
    { provide: AX_LOCALSTORAGE_SECRET_KEY, useValue: 'yYMg69ipc8di07O48LZpyDF4' },
    {
      provide: AX_TRANSLATION_LOADER,
      useClass: AppTranslationLoader,
    },
    {
      provide: AX_TRANSLATION_CONFIG,
      useValue: translationConfig({
        preload: {
          langs: ['en-US'],
          scopes: ['acorex'],
        },
        defaults: {
          lang: 'en-US',
          scope: 'acorex',
        },
      }),
    },
  ],
};
