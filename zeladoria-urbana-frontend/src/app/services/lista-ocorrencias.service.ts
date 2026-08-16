import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListaOcorrenciasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/ocorrencias';

  obterOcorrencias(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  atualizarStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  atualizarOcorrencia(id: number, dados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dados);
  }

  excluirOcorrencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}