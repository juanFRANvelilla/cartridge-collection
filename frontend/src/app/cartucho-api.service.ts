import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Cartucho } from './cartucho.model';

@Injectable({ providedIn: 'root' })
export class CartuchoApiService {
  private readonly http = inject(HttpClient);

  list(query: string): Observable<Cartucho[]> {
    const term = query.trim();
    const params = term ? new HttpParams().set('q', term) : undefined;
    return this.http.get<Cartucho[]>('/api/cartuchos', { params });
  }
}
