import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="logo">Zeladoria Urbana - Blumenau</div>
      
      <nav class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active">Painel Geral</a>
        <a routerLink="/novo-relato" routerLinkActive="active">Novo Relato</a>
        <a routerLink="/lista-ocorrencias" routerLinkActive="active">Ocorrências</a>
      </nav>
    </header>

    <main class="content-container">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'zeladoria-urbana-frontend';
}