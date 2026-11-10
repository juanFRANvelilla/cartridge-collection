import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Cartucho } from './cartucho.model';

@Injectable({ providedIn: 'root' })
export class CartuchoApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Cartucho[]> {
    return this.http.get<Cartucho[]>('/api/cartuchos');
  }

  save(items: Cartucho[]): Observable<Cartucho[]> {
    return this.http.put<Cartucho[]>('/api/cartuchos', { items });
  }
}
