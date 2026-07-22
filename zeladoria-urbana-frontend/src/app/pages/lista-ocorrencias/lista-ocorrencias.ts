import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
}

@Component({
  selector: 'app-lista-ocorrencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-ocorrencias.html',
  styleUrl: './lista-ocorrencias.scss'
})
export class ListaOcorrenciasComponent implements OnInit {
  public ocorrencias: Relato[] = [];

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
      next: (dados: any) => {
        this.ocorrencias = dados;
        
        this.ocorrencias.forEach(item => {
          this.buscarEnderecoPorCoordenadas(item);
        });

        this.cdr.detectChanges(); 
      },
      error: (erro: any) => {
        console.error('Erro ao carregar ocorrências do banco:', erro);
      }
    });
  }

buscarEnderecoPorCoordenadas(item: Relato): void {
  if (!item.latitude || !item.longitude) {
    item.endereco = 'Coordenadas não informadas';
    return;
  }

  const lat = String(item.latitude).trim();
  const lon = String(item.longitude).trim();

  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;

  this.http.get<any>(url).subscribe({
    next: (resposta) => {
      if (resposta && resposta.features && resposta.features.length > 0) {
        const props = resposta.features[0].properties;
        
        const rua = props.street || props.name || 'Rua não cadastrada';
        const bairro = props.district || props.suburb || props.city || 'Blumenau';
        
        item.endereco = `${rua} - ${bairro}`;
      } else {
        item.endereco = 'Blumenau';
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erro na busca de endereço:', err);
      item.endereco = 'Endereço Indisponível';
      this.cdr.detectChanges();
    }
  });
}

  abrirNoMapa(lat: string, lng: string): void {
    if (!lat || !lng) return;
    const urlGoogle = `https://www.google.com/maps?q=${lat},${lng}`;
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

  mudarStatus(item: any, novoStatus: string): void {
    if (!item.id) return;

    this.relatoService.atualizarStatus(item.id, novoStatus).subscribe({
      next: () => {
        item.status = novoStatus; 
        this.cdr.detectChanges(); 
      },
      error: (erro) => {
        console.error('Erro ao mudar status:', erro);
      }
    });
  }

  obterClasseStatus(status?: string): string {
    if (!status) return 'pendente';
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}