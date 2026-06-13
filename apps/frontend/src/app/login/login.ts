import { AXButtonComponent } from '@acorex/components/button';
import { AXFormComponent, AXFormFieldComponent, AXValidationRuleDirective } from '@acorex/components/form';
import { AXLabelComponent } from '@acorex/components/label';
import { AXLoadingComponent } from '@acorex/components/loading';
import { AXPasswordBoxComponent } from '@acorex/components/password-box';
import { AXTabItemComponent, AXTabsComponent, AXTabStripChangedEvent } from '@acorex/components/tabs';
import { AXTextBoxComponent } from '@acorex/components/text-box';
import { AXToastService } from '@acorex/components/toast';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@fe/services';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    AXTabsComponent,
    AXTabItemComponent,
    AXFormFieldComponent,
    AXButtonComponent,
    AXFormComponent,
    AXLabelComponent,
    AXTextBoxComponent,
    AXValidationRuleDirective,
    AXPasswordBoxComponent,
    AXLoadingComponent,
  ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(AXToastService);

  from = viewChild<AXFormComponent>('fromValid');
  mode = signal<'login' | 'register'>('login');
  username = '';
  password = '';
  displayName = '';
  error = signal<string | null>(null);
  loading = signal(false);

  setMode(event: AXTabStripChangedEvent) {
    // this.mode.set(m);
    this.mode.set(event.tab.key as 'login' | 'register');
    this.error.set(null);
  }

  async submit() {
    this.error.set(null);
    this.loading.set(true);
    this.from()
      ?.validate()
      .then(async (isValid) => {
        if (!isValid.result) {
          this.toastService.danger('اطلاعات وارد شده معتبر نیست');
          return;
        } else {
          try {
            if (this.mode() === 'login') {
              await this.auth.login(this.username, this.password);
            } else {
              await this.auth.register(this.username, this.password, this.displayName || undefined);
            }
            await this.router.navigate(['/room']);
          } catch (e: unknown) {
            const err = e as { error?: { message?: string | string[] }; message?: string };
            const msg = err.error?.message;
            this.error.set(Array.isArray(msg) ? msg.join('، ') : msg || err.message || 'خطا در ورود');
            this.toastService.danger(this.error() || 'خطا در ورود');
          } finally {
            this.loading.set(false);
          }
        }
      });
  }
}
