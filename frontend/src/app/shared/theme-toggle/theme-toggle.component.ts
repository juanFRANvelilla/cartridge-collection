import { Component, inject } from '@angular/core';

import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <label class="switch" [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
      <input type="checkbox" [checked]="theme.isDark()" (change)="theme.toggle()" />
      <span class="slider"></span>
    </label>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }

      .switch {
        display: block;
        --width-of-switch: 3.5em;
        --height-of-switch: 2em;
        --size-of-icon: 1.4em;
        --slider-offset: 0.3em;
        position: relative;
        width: var(--width-of-switch);
        height: var(--height-of-switch);
      }

      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #f4f4f5;
        transition: 0.4s;
        border-radius: 30px;
      }

      .slider:before {
        position: absolute;
        content: '';
        height: var(--size-of-icon, 1.4em);
        width: var(--size-of-icon, 1.4em);
        border-radius: 20px;
        left: var(--slider-offset, 0.3em);
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(40deg, #fbfb00, #ff6f00 70%);
        transition: 0.4s;
      }

      input:checked + .slider {
        background-color: #303136;
      }

      input:checked + .slider:before {
        left: calc(100% - (var(--size-of-icon, 1.4em) + var(--slider-offset, 0.3em)));
        background: #303136;
        box-shadow:
          inset -0.22em -0.14em 0.36em -0.14em #8983f7,
          inset -0.72em -0.28em 0 0 #a3dafb;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
