import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'zeladoria-urbana-frontend';

  authService = inject(AuthService);
  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}