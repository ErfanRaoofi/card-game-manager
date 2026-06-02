import { AXTranslation, AXTranslationLoader, AXTranslationLoaderOptions } from '@acorex/core/translation';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
@Injectable()
export class AppTranslationLoader implements AXTranslationLoader {
  private http = inject(HttpClient);
  load(options: AXTranslationLoaderOptions): Observable<AXTranslation> {
    // The i18n folder is located in the public project folder.
    const httpRequest = this.http.get<AXTranslation>(`assets/i18n/${options.lang}/${options.scope}.json`).pipe(first());
    return httpRequest;
  }
}
