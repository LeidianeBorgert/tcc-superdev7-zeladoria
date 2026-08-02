import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/usuarios';

  constructor(private http: HttpClient) {}

  cadastrar(dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cadastro`, dados);
  }

  login(dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, dados);
  }

  salvarSessao(usuario: any): void {
    localStorage.setItem('usuario_logado', JSON.stringify(usuario));
  }

  obterUsuarioLogado(): any {
    const user = localStorage.getItem('usuario_logado');
    return user ? JSON.parse(user) : null;
  }

  estaLogado(): boolean {
    return !!localStorage.getItem('usuario_logado');
  }

  logout(): void {
    localStorage.removeItem('usuario_logado');
  }
}