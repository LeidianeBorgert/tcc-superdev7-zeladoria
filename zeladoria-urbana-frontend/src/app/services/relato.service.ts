import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Relato {
  id?: number; 
  categoria: string;
  descricao: string;
  latitude: string;
  longitude: string;
  dataCriacao?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root' 
})
export class RelatoService {

  private apiUrl = 'http://localhost:8000/api/relatos';

  constructor(private http: HttpClient) { }

  public salvarRelato(relato: Relato): Observable<Relato> {
    return this.http.post<Relato>(this.apiUrl, relato);
  }

  public listarRelatos(): Observable<Relato[]> {
    return this.http.get<Relato[]>(this.apiUrl);
  }
  
  public atualizarStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status });
  }
}