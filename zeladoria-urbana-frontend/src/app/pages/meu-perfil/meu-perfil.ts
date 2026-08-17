import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // Injetado para forçar renderização no template

  private readonly API_URL = 'http://localhost:8000';

  usuarioLogado: Usuario | null = null;
  minhasOcorrencias: any[] = [];
  carregando: boolean = true;

  exibirModalExclusao: boolean = false;
  itemParaExcluir: any = null;

  ngOnInit(): void {
    this.usuarioLogado = this.authService.currentUserValue;
    this.carregarMinhasOcorrencias();
  }

  carregarMinhasOcorrencias(): void {
    if (!this.usuarioLogado) {
      this.carregando = false;
      return;
    }

    console.time('Tempo_API_Backend');

    this.ocorrenciasService.obterOcorrencias().subscribe({
      next: (dados: any) => { 
        console.timeEnd('Tempo_API_Backend');
        console.log('Dados recebidos do backend:', dados);
        console.log('Usuário logado:', this.usuarioLogado);

        if (Array.isArray(dados)) {
          this.minhasOcorrencias = dados
            .filter((item: any) => {
              const idMatch = (item.usuario_id || item.usuarioId || item.usuario?.id) === this.usuarioLogado?.id;
              const nomeMatch = (item.usuario_nome || item.usuarioNome || item.usuario?.nome) === this.usuarioLogado?.nome;
              const emailMatch = (item.usuario_email || item.usuarioEmail || item.usuario?.email) === this.usuarioLogado?.email;

              return idMatch || nomeMatch || emailMatch;
            })
            .map((item: any) => ({
              ...item,
              endereco: item.latitude && item.longitude 
                ? `Lat: ${item.latitude}, Lon: ${item.longitude}` 
                : 'Localização não informada'
            }));

          console.log('Ocorrências encontradas do usuário:', this.minhasOcorrencias);
        }

        // Finaliza o carregamento e força a atualização visual da tela
        this.carregando = false;
        this.cdr.detectChanges();

        // Busca os endereços reais em segundo plano
        if (this.minhasOcorrencias.length > 0) {
          setTimeout(() => {
            this.minhasOcorrencias.forEach((item: any) => {
              this.buscarEnderecoEmSegundoPlano(item);
            });
          }, 100);
        }
      },
      error: (err: any) => { 
        console.timeEnd('Tempo_API_Backend');
        console.error('Erro ao buscar minhas ocorrências', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buscarEnderecoEmSegundoPlano(item: any): void {
    if (!item.latitude || !item.longitude) return;

    const url = `${this.API_URL}/api/geocodificar-reversa?lat=${item.latitude}&lon=${item.longitude}`;
    this.http.get<any>(url).subscribe({
      next: (resposta: any) => {
        if (resposta && resposta.address) {
          const addr = resposta.address;
          const rua = addr.road || addr.pedestrian || addr.street || addr.suburb || 'Rua não identificada';
          const bairro = addr.neighbourhood || addr.suburb || addr.city_district || addr.district || addr.city || 'Blumenau';
          
          item.endereco = `${rua} - ${bairro}`;
          this.cdr.detectChanges(); // Atualiza a tela assim que o endereço chegar
        }
      },
      error: () => {}
    });
  }

  formatarCategoria(categoria: string): string {
    const nomes: { [key: string]: string } = {
      'asfalto': 'Asfalto Danificado',
      'buraco': 'Buraco na Via',
      'vazamento': 'Vazamento de Água/Esgoto',
      'iluminacao': 'Iluminação Pública',
      'lixo': 'Descarte de Lixo',
      'calçada': 'Calçada Danificada / Obstáculo'
    };
    return nomes[categoria] || categoria;
  }

  obterUrlFoto(item: any): string | null {
    const foto = item.foto || item.imagem;
    if (!foto || foto === 'Sem Foto' || foto.includes('placeholder')) return null;
    if (foto.startsWith('data:image') || foto.startsWith('http://') || foto.startsWith('https://')) return foto;
    if (foto.includes('/') || foto.includes('\\') || foto.includes('.')) {
      const caminhoFormatado = foto.startsWith('/') ? foto : `/${foto}`;
      return `${this.API_URL}${caminhoFormatado}`;
    }
    return `data:image/jpeg;base64,${foto}`;
  }

  editarOcorrencia(item: any): void {
    this.router.navigate(['/novo-relato'], { queryParams: { id: item.id } });
  }

  iniciarExclusao(item: any): void {
    this.itemParaExcluir = item;
    this.exibirModalExclusao = true;
  }

  cancelarExclusao(): void {
    this.exibirModalExclusao = false;
    this.itemParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.itemParaExcluir || !this.itemParaExcluir.id) return;

    const id = this.itemParaExcluir.id;
    this.ocorrenciasService.excluirOcorrencia(id).subscribe({
      next: () => {
        this.minhasOcorrencias = this.minhasOcorrencias.filter(o => o.id !== id);
        this.cancelarExclusao();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao excluir ocorrência:', err);
        this.cancelarExclusao();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}