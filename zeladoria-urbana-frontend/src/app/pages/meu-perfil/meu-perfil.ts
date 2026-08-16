import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ListaOcorrenciasService } from '../../services/lista-ocorrencias.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-meu-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meu-perfil.html',
  styleUrls: ['./meu-perfil.scss']
})
export class MeuPerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private ocorrenciasService = inject(ListaOcorrenciasService);

  usuarioLogado: Usuario | null = null;
  minhasOcorrencias: any[] = [];
  carregando: boolean = true;

  ngOnInit(): void {
    this.usuarioLogado = this.authService.currentUserValue;
    this.carregarMinhasOcorrencias();
  }

  carregarMinhasOcorrencias(): void {
    if (!this.usuarioLogado) return;

    this.ocorrenciasService.obterOcorrencias().subscribe({
      next: (dados: any) => { 
        if (Array.isArray(dados)) {
          this.minhasOcorrencias = dados.filter((item: any) => item.usuario_id === this.usuarioLogado?.id);
        }
        this.carregando = false;
      },
      error: (err: any) => { 
        console.error('Erro ao buscar minhas ocorrências', err);
        this.carregando = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}