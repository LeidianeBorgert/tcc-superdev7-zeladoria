import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  public email: string = '';
  public senha: string = '';
  public erroMensagem: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  fazerLogin(): void {
    if (!this.email || !this.senha) {
      this.erroMensagem = 'Preencha todos os campos.';
      return;
    }

    this.authService.login({ email: this.email, senha: this.senha }).subscribe({
      next: (resposta) => {
        this.authService.salvarSessao(resposta);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.erroMensagem = err.error?.detail || 'Erro ao realizar login.';
      }
    });
  }
}