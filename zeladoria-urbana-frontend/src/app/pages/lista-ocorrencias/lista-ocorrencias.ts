import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RelatoService } from '../../services/relato.service';

interface Relato {
  id?: number;
  categoria: string;
  descricao: string;
  latitude: string;
  longitude: string;
  dataCriacao?: string;
  status?: string;
  endereco?: string;
  foto?: string;
  imagem?: string;
  usuario_nome?: string; 
  emEdicao?: boolean;     
  descricaoEditada?: string; 
}

@Component({
  selector: 'app-lista-ocorrencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-ocorrencias.html',
  styleUrl: './lista-ocorrencias.scss'
})
export class ListaOcorrenciasComponent implements OnInit {
  private readonly API_URL = 'http://localhost:8000';

  public ocorrencias: Relato[] = [];
  public ocorrenciasFiltradas: Relato[] = [];

  public filtroBairro: string = '';
  public filtroRua: string = '';
  public filtroCategoria: string = '';

  public categoriasOrdenadas = [
    { value: 'asfalto', label: 'Asfalto Danificado' },
    { value: 'buraco', label: 'Buraco na Via' },
    { value: 'calçada', label: 'Calçada Danificada / Obstáculo' },
    { value: 'lixo', label: 'Descarte de Lixo' },
    { value: 'iluminacao', label: 'Iluminação Pública' },
    { value: 'vazamento', label: 'Vazamento de Água/Esgoto' }
  ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  public paginaAtual: number = 1;
  public itensPorPagina: number = 5;

  private cacheEnderecos: { [chave: string]: string } = {};

  public exibirModalExclusao: boolean = false;
  public itemParaExcluir: Relato | null = null;

  constructor(
    private relatoService: RelatoService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.carregarOcorrencias();
  }

  carregarOcorrencias(): void {
    this.relatoService.listarRelatos().subscribe({
      next: (dados: any): void => {
        this.ocorrencias = dados;
        this.ocorrenciasFiltradas = [...dados]; 

        this.ocorrencias.forEach((item: Relato): void => {
          if (!item.endereco) {
            item.endereco = `Lat: ${item.latitude}, Lon: ${item.longitude}`;
          }
        });

        this.cdr.detectChanges(); 
        this.processarFilaNominatim(0);
      },
      error: (erro: any): void => {
        console.error('Erro ao carregar ocorrências do banco:', erro);
      }
    });
  }

  obterUrlFoto(item: Relato): string | null {
    const foto = item.foto || item.imagem;

    if (!foto || foto === 'Sem Foto' || foto.includes('placeholder')) {
      return null;
    }

    if (foto.startsWith('data:image') || foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }

    if (foto.includes('/') || foto.includes('\\') || foto.includes('.')) {
      const caminhoFormatado = foto.startsWith('/') ? foto : `/${foto}`;
      return `${this.API_URL}${caminhoFormatado}`;
    }

    return `data:image/jpeg;base64,${foto}`;
  }

  private processarFilaNominatim(indice: number): void {
    if (indice >= this.ocorrencias.length) return;

    const item: Relato = this.ocorrencias[indice];

    if (item.endereco && !item.endereco.startsWith('Lat:')) {
      this.processarFilaNominatim(indice + 1);
      return;
    }

    this.buscarEnderecoPorCoordenadas(item, (): void => {
      setTimeout((): void => {
        this.processarFilaNominatim(indice + 1);
      }, 1000); 
    });
  }

  buscarEnderecoPorCoordenadas(item: Relato, proximo?: () => void): void {
    if (!item.latitude || !item.longitude) {
      item.endereco = 'Coordenadas não informadas';
      if (proximo) proximo();
      return;
    }

    const lat: string = String(item.latitude).trim();
    const lon: string = String(item.longitude).trim();
    const chaveCache: string = `${lat},${lon}`;

    if (this.cacheEnderecos[chaveCache]) {
      item.endereco = this.cacheEnderecos[chaveCache];
      this.aplicarFiltros();
      if (proximo) proximo();
      return;
    }

    const url: string = `${this.API_URL}/api/geocodificar-reversa?lat=${lat}&lon=${lon}`;
    
    this.http.get<any>(url).subscribe({
      next: (resposta: any): void => {
        if (resposta && resposta.address) {
          const addr = resposta.address;
          
          const rua: string = addr.road || addr.pedestrian || addr.street || addr.suburb || 'Rua não cadastrada';
          const bairro: string = addr.neighbourhood || addr.suburb || addr.city_district || addr.district || addr.city || 'Blumenau';

          item.endereco = `${rua} - ${bairro}`;
        } else {
          item.endereco = `Lat: ${lat}, Lon: ${lon}`;
        }
        
        this.cacheEnderecos[chaveCache] = item.endereco;
        this.aplicarFiltros();
        if (proximo) proximo();
      },
      error: (): void => {
        item.endereco = `Lat: ${lat}, Lon: ${lon}`;
        this.aplicarFiltros();
        if (proximo) proximo();
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1; 

    this.ocorrenciasFiltradas = this.ocorrencias.filter((item: Relato): boolean => {
      const endereco: string = (item.endereco || '').toLowerCase();
      const categoria: string = (item.categoria || '').toLowerCase();
      const categoriaFormatada: string = this.formatarCategoria(item.categoria).toLowerCase();

      const termoBairro: string = this.filtroBairro.trim().toLowerCase();
      const termoRua: string = this.filtroRua.trim().toLowerCase();
      const termoCategoria: string = this.filtroCategoria.trim().toLowerCase();

      const bateuBairro: boolean = !termoBairro || endereco.includes(termoBairro);
      const bateuRua: boolean = !termoRua || endereco.includes(termoRua);
      
      const bateuCategoria: boolean = !termoCategoria || 
        categoria === termoCategoria || 
        categoriaFormatada.includes(termoCategoria);

      return bateuBairro && bateuRua && bateuCategoria;
    });

    this.cdr.detectChanges();
  }

  limparFiltros(): void {
    this.filtroBairro = '';
    this.filtroRua = '';
    this.filtroCategoria = '';
    this.paginaAtual = 1;
    this.ocorrenciasFiltradas = [...this.ocorrencias];
    this.cdr.detectChanges();
  }

  obterOcorrenciasPaginadas(): Relato[] {
    const inicio: number = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim: number = inicio + this.itensPorPagina;
    return this.ocorrenciasFiltradas.slice(inicio, fim);
  }

  obterTotalPaginas(): number {
    if (!this.ocorrenciasFiltradas || this.ocorrenciasFiltradas.length === 0) {
      return 1;
    }
    return Math.ceil(this.ocorrenciasFiltradas.length / this.itensPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaAtual > 1) {
      this.paginaAtual--;
    }
  }

  proximaPagina(): void {
    if (this.paginaAtual < this.obterTotalPaginas()) {
      this.paginaAtual++;
    }
  }

  abrirNoMapa(lat: string, lng: string): void {
    if (!lat || !lng) return;
    const urlGoogle: string = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(urlGoogle, '_blank');
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

  mudarStatus(item: Relato, novoStatus: string): void {
    if (!item.id) return;

    this.relatoService.atualizarStatus(item.id, novoStatus).subscribe({
      next: (): void => {
        item.status = novoStatus; 
        this.cdr.detectChanges(); 
      },
      error: (erro: any): void => {
        console.error('Erro ao mudar status:', erro);
      }
    });
  }

  obterClasseStatus(status?: string): string {
    if (!status) return 'pendente';
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  iniciarEdicao(item: Relato): void {
    item.emEdicao = true;
    item.descricaoEditada = item.descricao;
    this.cdr.detectChanges();
  }

  salvarEdicao(item: Relato): void {
    if (!item.id || !item.descricaoEditada?.trim()) return;

    this.http.put(`${this.API_URL}/api/relatos/${item.id}`, { descricao: item.descricaoEditada })
      .subscribe({
        next: () => {
          item.descricao = item.descricaoEditada!;
          item.emEdicao = false;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erro ao editar ocorrência:', err)
      });
  }

  iniciarExclusao(item: Relato): void {
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

    this.http.delete(`${this.API_URL}/api/relatos/${id}`)
      .subscribe({
        next: () => {
          this.ocorrencias = this.ocorrencias.filter(o => o.id !== id);
          this.aplicarFiltros();
          this.cancelarExclusao();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao excluir ocorrência:', err);
          this.cancelarExclusao();
        }
      });
  }
}