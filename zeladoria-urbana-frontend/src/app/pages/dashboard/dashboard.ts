import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelatoService } from '../../services/relato.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  public totalNovos: number = 3; 
  public emAndamento: number = 5;  
  public resolvidos: number = 28;  

  constructor(private relatoService: RelatoService) {}

  ngOnInit(): void {
    this.carregarContadores();
  }

  private carregarContadores(): void {
    this.relatoService.listarRelatos().subscribe({
      next: (dados) => {
       
        if (dados) {
          this.totalNovos = dados.length;
        }
      },
      error: (erro) => {
   
        console.warn('API Offline no Dashboard.');
      }
    });
  }
}