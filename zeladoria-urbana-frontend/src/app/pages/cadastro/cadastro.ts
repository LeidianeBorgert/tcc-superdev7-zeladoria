import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss'
})
export class CadastroComponent {
  public nome: string = '';
  public email: string = '';
  public senha: string = '';
  public erroMensagem: string = '';
  public sucessoMensagem: string = '';
  public senhaVisivel: boolean = false; 

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  alternarVisibilidadeSenha(): void {
    this.senhaVisivel = !this.senhaVisivel;
  }

  cadastrar(): void {
    if (!this.nome || !this.email || !this.senha) {
      this.erroMensagem = 'Preencha todos os campos.';
      return;
    }

    this.authService.cadastrar({ nome: this.nome, email: this.email, senha: this.senha }).subscribe({
      next: () => {
        this.sucessoMensagem = 'Cadastro realizado com sucesso! Redirecionando...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.erroMensagem = err.error?.detail || 'Erro ao realizar cadastro.';
      }
    });
  }
}