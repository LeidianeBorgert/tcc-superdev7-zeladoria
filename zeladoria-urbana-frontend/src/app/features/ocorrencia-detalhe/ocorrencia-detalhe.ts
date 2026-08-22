import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-ocorrencia-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ocorrencia-detalhe.html',
  styleUrl: './ocorrencia-detalhe.scss'
})
export class OcorrenciaDetalheComponent implements OnInit {
  private readonly API_URL = 'http://localhost:8000';
  
  public ocorrenciaId: string | null = null;
  public ocorrencia: any = null;
  public fotoSelecionadaIndex: number = 0;
  public listaFotos: string[] = [];

  public novoComentarioTexto: string = '';
  public listaComentarios: any[] = [];

  public voltarParaLista(): void {
    this.router.navigate(['/lista-ocorrencias']);
  }
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ocorrenciaId = this.route.snapshot.paramMap.get('id');
    if (this.ocorrenciaId) {
      this.carregarOcorrenciaDetalhe(this.ocorrenciaId);
    }
  }

carregarOcorrenciaDetalhe(id: string): void {
    this.http.get<any>(`${this.API_URL}/api/relatos/${id}`).subscribe({
      next: (dados) => {
        this.ocorrencia = dados;
        console.log('DADOS COMPLETOS DA OCORRÊNCIA:', dados);
        this.processarFotos();
        
        if (dados.comentarios && Array.isArray(dados.comentarios)) {
          this.listaComentarios = dados.comentarios;
        }

        if (!this.ocorrencia.endereco) {
          this.ocorrencia.endereco = `Lat: ${dados.latitude}, Lon: ${dados.longitude}`;
          this.buscarEnderecoPorCoordenadas(dados.latitude, dados.longitude);
        }
        
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar detalhes da ocorrência:', erro);
      }
    });
  }

public adicionarComentario(): void {
    if (!this.novoComentarioTexto || !this.novoComentarioTexto.trim()) {
      return;
    }

    if (!this.ocorrenciaId) return;

    let nomeUsuarioLogado = 'Usuário';
    let usuarioId = 1;

    const usuarioSalvo = localStorage.getItem('usuario') || localStorage.getItem('user') || localStorage.getItem('usuario_logado');
    if (usuarioSalvo) {
      try {
        const userObj = JSON.parse(usuarioSalvo);
        usuarioId = userObj.id || userObj.usuario_id || 1;
        nomeUsuarioLogado = userObj.nome || userObj.name || userObj.usuario_nome || userObj.username || 'Usuário';
      } catch (e) {
        console.error('Erro ao ler dados do usuário logado', e);
      }
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const payload = {
      texto: this.novoComentarioTexto.trim(),
      usuario_id: usuarioId
    };

    this.http.post<any>(`${this.API_URL}/api/relatos/${this.ocorrenciaId}/comentarios`, payload).subscribe({
      next: (resposta) => {
        this.listaComentarios.push({
          usuario_nome: resposta.usuario_nome || nomeUsuarioLogado,
          texto: resposta.texto || this.novoComentarioTexto,
          dataCriacao: resposta.dataCriacao || dataAtual
        });
        this.novoComentarioTexto = '';
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao enviar comentário, adicionando localmente:', erro);
        
        this.listaComentarios.push({
          usuario_nome: nomeUsuarioLogado,
          texto: this.novoComentarioTexto,
          dataCriacao: dataAtual
        });
        this.novoComentarioTexto = '';
        this.cdr.detectChanges();
      }
    });
  }
  public curtirOcorrencia(): void {
    if (!this.ocorrenciaId) return;

    const usuarioSalvo = localStorage.getItem('usuario'); 
    const usuarioId = usuarioSalvo ? JSON.parse(usuarioSalvo).id : 1; 

    this.http.post<any>(`${this.API_URL}/api/relatos/${this.ocorrenciaId}/curtir`, { usuario_id: usuarioId }).subscribe({
      next: (resposta) => {
        this.ocorrencia.curtido = resposta.curtido;
        this.ocorrencia.totalCurtidas = resposta.totalCurtidas;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao registrar apoio:', erro);
      }
    });
  }

  buscarEnderecoPorCoordenadas(lat: string, lon: string): void {
    if (!lat || !lon) return;

    const url = `${this.API_URL}/api/geocodificar-reversa?lat=${lat}&lon=${lon}`;
    
    this.http.get<any>(url).subscribe({
      next: (resposta: any) => {
        if (resposta && resposta.address) {
          const addr = resposta.address;
          const rua = addr.road || addr.pedestrian || addr.street || addr.suburb || 'Rua não cadastrada';
          const bairro = addr.neighbourhood || addr.suburb || addr.city_district || addr.district || addr.city || 'Blumenau';
          
          this.ocorrencia.endereco = `${rua} - ${bairro}`;
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  public processarFotos(): void {
    const lista: string[] = [];
    if (this.ocorrencia) {
      const fotoPrincipal = this.obterUrlFoto(this.ocorrencia.foto);
      if (fotoPrincipal) {
        lista.push(fotoPrincipal);
      }

      const arrayFotos = this.ocorrencia.fotos || this.ocorrencia.fotos_extras;
      if (arrayFotos && Array.isArray(arrayFotos)) {
        arrayFotos.forEach((f: any) => {
          const caminho = typeof f === 'string' ? f : (f.url || f.caminho);
          const urlExtra = this.obterUrlFoto(caminho);
          if (urlExtra && !lista.includes(urlExtra)) {
            lista.push(urlExtra);
          }
        });
      }
    }
    this.listaFotos = lista;
  }

  public selecionarFoto(index: number): void {
    this.fotoSelecionadaIndex = index;
    this.cdr.detectChanges();
  }

  public proximaFoto(): void {
    if (this.listaFotos.length > 0) {
      this.fotoSelecionadaIndex = (this.fotoSelecionadaIndex + 1) % this.listaFotos.length;
      this.cdr.detectChanges();
    }
  }

  public fotoAnterior(): void {
    if (this.listaFotos.length > 0) {
      this.fotoSelecionadaIndex = (this.fotoSelecionadaIndex - 1 + this.listaFotos.length) % this.listaFotos.length;
      this.cdr.detectChanges();
    }
  }

  formatarCategoria(categoria: string): string {
    const nomes: { [key: string]: string } = {
      'asfalto': 'Asfalto Danificado',
      'buraco': 'Buraco na Via',
      'vazamento': 'Vazamento de Água/Esgoto',
      'iluminacao': 'Iluminação Pública',
      'Iluminação Pública': 'Iluminação Pública',
      'lixo': 'Descarte de Lixo',
      'calçada': 'Calçada Danificada / Obstáculo' 
    };
    return nomes[categoria] || categoria;
  }

  obterUrlFoto(foto: string): string | null {
    if (!foto || foto === 'Sem Foto' || foto.includes('placeholder')) {
      return null;
    }
    if (foto.startsWith('data:image') || foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    const caminhoFormatado = foto.startsWith('/') ? foto : `/${foto}`;
    return `${this.API_URL}${caminhoFormatado}`;
  }

  obterClasseStatus(status?: string): string {
    if (!status) return 'pendente';
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}