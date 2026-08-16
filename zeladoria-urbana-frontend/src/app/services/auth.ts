import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = 'http://localhost:8000/api/usuarios';

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const savedUser = localStorage.getItem('usuario_logado');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  estaLogado(): boolean {
    return !!this.currentUserValue;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'ADMIN';
  }

  login(dados: any): Observable<any> {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, dados).pipe(
      tap((usuario) => {
        localStorage.setItem('usuario_logado', JSON.stringify(usuario));
        this.currentUserSubject.next(usuario);

        if (usuario.role === 'ADMIN') {
          this.router.navigate(['/lista-ocorrencias']);
        } else {
          this.router.navigate(['/meu-perfil']);
        }
      })
    );
  }

  cadastrar(dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cadastro`, dados).pipe(
      tap(() => {
        this.router.navigate(['/login']);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('usuario_logado');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}