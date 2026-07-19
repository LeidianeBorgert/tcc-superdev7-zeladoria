import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelatoService } from '../../services/relato.service';

interface Relato {
  id?: number;
  categoria: string;
  descricao: string;
  latitude: string;
  longitude: string;
  dataCriacao?: string;
  status?: string;
}

@Component({
  selector: 'app-lista-ocorrencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-ocorrencias.html',
  styleUrl: './lista-ocorrencias.scss'
})
export class ListaOcorrenciasComponent implements OnInit {
  public ocorrencias: any[] = [];

  
  constructor(
    private relatoService: RelatoService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.carregarOcorrencias();
  }

  carregarOcorrencias(): void {
    this.relatoService.listarRelatos().subscribe({
      next: (dados: any) => {
        this.ocorrencias = dados;
        console.log('Ocorrências carregadas com sucesso:', this.ocorrencias);
        
        
        this.cdr.detectChanges(); 
      },
      error: (erro: any) => {
        console.error('Erro ao carregar ocorrências do banco:', erro);
      }
    });
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
        console.log('Status updated com sucesso!');
        
        
        this.cdr.detectChanges(); 
      },
      error: (erro) => {
        console.error('Erro ao mudar status:', erro);
      }
    });
  }
}