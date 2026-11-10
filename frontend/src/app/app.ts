import { Component, OnInit, inject, signal } from '@angular/core';

import { CartuchoApiService } from './cartucho-api.service';
import { Cartucho } from './cartucho.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly api = inject(CartuchoApiService);

  readonly query = signal('');
  readonly rows = signal<Cartucho[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.load();
  }

  precio(value: number | null): string {
    if (value === null) {
      return '—';
    }
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.list(this.query()).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
        this.errorMessage.set('No se ha podido cargar el listado.');
      },
    });
  }
}
