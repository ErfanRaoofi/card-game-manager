import { AXPlatform } from '@acorex/core/platform';
import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  platformService = inject(AXPlatform);
  platformId = inject(PLATFORM_ID);

  private currentTheme = 'one'; // Default theme
  private themeLinkElement!: HTMLLinkElement;

  constructor() {
    // Check if a theme is saved in localStorage, otherwise default to 'one.css'
    afterNextRender(() => {
      const themeMode = localStorage.getItem('AX_THEME_MODE');
      if (!themeMode) {
        this.platformService.switchLightMode();
      } else {
        this.platformService.autoDetectThemeMode();
      }

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.currentTheme = savedTheme;
      }
      this.loadTheme(this.currentTheme);
    });
  }
  // Method to dynamically load the selected theme CSS
  loadTheme(theme: string) {
    if (!this.themeLinkElement) {
      // Create link element if it doesn't exist
      this.themeLinkElement = document.createElement('link');
      this.themeLinkElement.rel = 'stylesheet';
      this.themeLinkElement.id = 'theme-link'; // Important for later reference
      document.head.appendChild(this.themeLinkElement); // Append to <head> globally
    }
    // Set the href of the theme based on selected theme
    this.themeLinkElement.href = `assets/themes/${theme}.css`; // Assume themes are in the assets folder
    localStorage.setItem('theme', theme); // Save theme to localStorage
  }

  getCurrentTheme(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('theme') || this.currentTheme;
    } else {
      return this.currentTheme;
    }
  }
}
