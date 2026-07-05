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
}