import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';

import { CartuchoApiService } from './cartucho-api.service';
import { Cartucho } from './cartucho.model';
import { descargar, documentoWord, libroExcel } from './export-listado';
import { ThemeToggleComponent } from './shared/theme-toggle/theme-toggle.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly api = inject(CartuchoApiService);
  private readonly theme = inject(ThemeService);

  readonly query = signal('');
  readonly draft = signal<Cartucho[]>([]);
  readonly baseline = signal<Cartucho[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly precioTexto = signal<Record<string, string>>({});
  readonly dragFrom = signal<number | null>(null);
  readonly dragOver = signal<number | null>(null);

  readonly visible = computed(() => {
    const term = this.query().trim().toLowerCase();
    const rows = this.draft();
    if (!term) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.numero.toLowerCase().includes(term) || row.descripcion.toLowerCase().includes(term),
    );
  });

  readonly dirty = computed(
    () =>
      this.signature(this.draft()) !== this.signature(this.baseline()) ||
      Object.values(this.precioTexto()).some((value) => parsePrecio(value) === undefined),
  );

  ngOnInit(): void {
    this.theme.isDark();
    this.load();
  }

  onSearch(value: string): void {
    this.query.set(value);
  }

  exportExcel(): void {
    descargar(libroExcel(this.visible()), 'coleccion-cartuchos.xlsx');
  }

  exportWord(): void {
    descargar(documentoWord(this.visible()), 'coleccion-cartuchos.docx');
  }

  anadir(): void {
    const row: Cartucho = {
      id: `nuevo-${crypto.randomUUID()}`,
      numero: '',
      descripcion: '',
      precio: null,
      orden: this.draft().length + 1,
    };
    this.query.set('');
    this.draft.update((rows) => [...rows, row]);
    this.editingId.set(row.id);
    this.precioTexto.update((current) => ({ ...current, [row.id]: '' }));
    this.errorMessage.set(null);
    queueMicrotask(() => document.querySelector('tbody tr:last-child')?.scrollIntoView({ block: 'center' }));
  }

  precio(value: number | null): string {
    if (value === null) {
      return '—';
    }
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  }

  precioCampo(row: Cartucho): string {
    const typed = this.precioTexto()[row.id];
    if (typed !== undefined) {
      return typed;
    }
    return row.precio === null ? '' : String(row.precio).replace('.', ',');
  }

  toggleEdit(row: Cartucho): void {
    if (this.editingId() === row.id) {
      this.editingId.set(null);
      return;
    }
    this.editingId.set(row.id);
    this.precioTexto.update((current) => ({
      ...current,
      [row.id]: row.precio === null ? '' : String(row.precio).replace('.', ','),
    }));
  }

  patchTexto(id: string, field: 'numero' | 'descripcion', value: string): void {
    this.draft.update((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  patchPrecio(id: string, value: string): void {
    this.precioTexto.update((current) => ({ ...current, [id]: value }));
    const parsed = parsePrecio(value);
    if (parsed === undefined) {
      return;
    }
    this.draft.update((rows) => rows.map((row) => (row.id === id ? { ...row, precio: parsed } : row)));
  }

  private nativeDrag = false;

  gripDown(event: PointerEvent, index: number): void {
    if (event.button !== 0 || this.visible().length < 2 || this.editingId() === this.visible()[index]?.id) {
      return;
    }
    this.dragFrom.set(index);
    this.dragOver.set(index);
  }

  onDragStart(event: DragEvent, index: number): void {
    if (this.editingId() === this.visible()[index]?.id) {
      event.preventDefault();
      return;
    }
    this.nativeDrag = true;
    this.dragFrom.set(index);
    this.dragOver.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    if (this.dragFrom() === null) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOver.set(index);
  }

  onDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('text/plain');
    const from = raw ? Number(raw) : this.dragFrom();
    this.dragFrom.set(null);
    this.dragOver.set(null);
    this.nativeDrag = false;
    if (from !== null && !Number.isNaN(from) && from !== index) {
      this.moveVisible(from, index);
    }
  }

  onDragEnd(): void {
    this.nativeDrag = false;
    this.dragFrom.set(null);
    this.dragOver.set(null);
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.dragFrom() === null) {
      return;
    }
    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest('tr[data-index]');
    if (!(row instanceof HTMLElement)) {
      return;
    }
    const index = Number(row.dataset['index']);
    if (!Number.isNaN(index)) {
      this.dragOver.set(index);
    }
  }

  @HostListener('document:pointerup')
  onPointerUp(): void {
    if (this.nativeDrag) {
      return;
    }
    const from = this.dragFrom();
    const to = this.dragOver();
    this.dragFrom.set(null);
    this.dragOver.set(null);
    if (from === null || to === null || from === to) {
      return;
    }
    this.moveVisible(from, to);
  }

  confirm(): void {
    const invalid = Object.entries(this.precioTexto()).find(([, value]) => parsePrecio(value) === undefined);
    if (invalid) {
      this.errorMessage.set('Revisa el precio. Usa un número, o déjalo vacío.');
      return;
    }
    const items = this.draft().map((row, index) => ({
      ...row,
      numero: row.numero.trim(),
      descripcion: row.descripcion.trim(),
      orden: index + 1,
    }));
    if (items.some((row) => !row.numero || !row.descripcion)) {
      this.errorMessage.set('El número y la descripción son obligatorios.');
      return;
    }
    const repetido = numeroRepetido(items, this.baseline());
    if (repetido) {
      this.errorMessage.set(`El número ${repetido} ya está en el listado.`);
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);
    this.api.save(items).subscribe({
      next: (rows) => {
        this.replace(rows);
        this.saving.set(false);
      },
      error: (err: { error?: { detail?: string } }) => {
        this.saving.set(false);
        this.errorMessage.set(this.detail(err) || 'No se han podido guardar los cambios.');
      },
    });
  }

  cancel(): void {
    this.draft.set(this.baseline().map((row) => ({ ...row })));
    this.editingId.set(null);
    this.precioTexto.set({});
    this.errorMessage.set(null);
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.list().subscribe({
      next: (rows) => {
        this.replace(rows);
        this.loading.set(false);
      },
      error: () => {
        this.draft.set([]);
        this.baseline.set([]);
        this.loading.set(false);
        this.errorMessage.set('No se ha podido cargar el listado.');
      },
    });
  }

  private replace(rows: Cartucho[]): void {
    const ordered = [...rows].sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));
    this.baseline.set(ordered.map((row) => ({ ...row })));
    this.draft.set(ordered.map((row) => ({ ...row })));
    this.editingId.set(null);
    this.precioTexto.set({});
  }

  private moveVisible(from: number, to: number): void {
    const visible = [...this.visible()];
    const [moved] = visible.splice(from, 1);
    visible.splice(to, 0, moved);
    const visibleIds = new Set(visible.map((row) => row.id));
    const queue = [...visible];
    const merged = this.draft().map((row) => (visibleIds.has(row.id) ? queue.shift()! : row));
    this.draft.set(merged.map((row, index) => ({ ...row, orden: index + 1 })));
  }

  private signature(rows: Cartucho[]): string {
    return JSON.stringify(
      rows.map((row) => [row.id, row.numero, row.descripcion, row.precio, row.orden]),
    );
  }

  private detail(err: { error?: { detail?: unknown } }): string | null {
    const detail = err.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return null;
  }
}

function numeroRepetido(draft: Cartucho[], baseline: Cartucho[]): string | null {
  const actuales = new Map<string, number>();
  for (const row of baseline) {
    actuales.set(row.numero, (actuales.get(row.numero) ?? 0) + 1);
  }
  const propuesta = new Map<string, number>();
  for (const row of draft) {
    propuesta.set(row.numero, (propuesta.get(row.numero) ?? 0) + 1);
  }
  for (const [numero, veces] of propuesta) {
    if (veces > Math.max(actuales.get(numero) ?? 0, 1)) {
      return numero;
    }
  }
  return null;
}

function parsePrecio(raw: string): number | null | undefined {
  const text = raw.trim().replace(/\s/g, '');
  if (!text) {
    return null;
  }
  const normalized = text.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return undefined;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value * 100) / 100;
}
