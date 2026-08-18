import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.scss'
})
export class ConfiguracoesComponent implements OnInit {
  
  usuario = {
    nome: '',
    email: ''
  };

  senhas = {
    atual: '',
    nova: '',
    confirmar: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.carregarDadosUsuario();
  }

  carregarDadosUsuario() {
    const usuarioLogado = this.authService.currentUserValue;
    
    if (usuarioLogado) {
      this.usuario.nome = usuarioLogado.nome; 
      this.usuario.email = usuarioLogado.email;
    }
  }

  toggleSenhaInput(inputElement: HTMLInputElement, iconeElement: HTMLElement) {
    if (inputElement.type === 'password') {
      inputElement.type = 'text';
      iconeElement.classList.remove('fa-eye');
      iconeElement.classList.add('fa-eye-slash');
    } else {
      inputElement.type = 'password';
      iconeElement.classList.remove('fa-eye-slash');
      iconeElement.classList.add('fa-eye');
    }
  }

  salvarDados() {
    console.log("Salvando alterações do usuário...", this.usuario);
    alert("Alterações salvas com sucesso!");
  }

  atualizarSenha() {
    if (this.senhas.nova !== this.senhas.confirmar) {
      alert("As senhas não coincidem!");
      return;
    }
    console.log("Atualizando senha...");
    alert("Senha alterada com sucesso!");
  }

  excluirConta() {
    if (confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) {
      console.log("Conta excluída.");
      this.authService.logout();
    }
  }
}