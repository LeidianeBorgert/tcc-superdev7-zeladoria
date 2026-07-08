import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './lista-ocorrencias.html',
  styleUrl: './lista-ocorrencias.scss'
})
export class ListaOcorrenciasComponent implements OnInit {
  public ocorrencias: Relato[] = [];

  constructor(private relatoService: RelatoService) {}

  ngOnInit(): void {
    this.carregarOcorrencias();
  }

  carregarOcorrencias(): void {
    this.relatoService.listarRelatos().subscribe({
      next: (dados: any) => {
        this.ocorrencias = dados;
      },
      error: (erro: any) => {
        console.error('Erro ao carregar ocorrências do banco:', erro);
      }
    });
  }

  formatarCategoria(categoria: string): string {
    const nomes: { [key: string]: string } = {
      'asfalto': 'Asfalto Danificado',
      'iluminacao': 'Iluminação Pública',
      'lixo': 'Descarte de Lixo'
    };
    return nomes[categoria] || categoria;
  }
  mudarStatus(item: Relato, novoStatus: string): void {
    if (!item.id) return;

    this.relatoService.atualizarStatus(item.id, novoStatus).subscribe({
      next: () => {
        item.status = novoStatus; 
        console.log('Status atualizado com sucesso!');
      },
      error: (erro) => {
        console.error('Erro ao mudar status:', erro);
      }
    });
  }
}