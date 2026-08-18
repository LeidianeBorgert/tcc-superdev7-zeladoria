import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelatoService } from '../../services/relato.service';
import { Chart, registerables } from 'chart.js';
import * as L from 'leaflet';
import 'leaflet.heat';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('graficoPolar') private canvasRef!: ElementRef;
  private chart: any;
  private map!: L.Map;
  private heatLayer: any;

  public totalNovos: number = 0; 
  public emAndamento: number = 0;   
  public resolvidos: number = 0; 

  constructor(
    private relatoService: RelatoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDadosDashboard();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('heatmap', {
      center: [-26.9194, -49.0661],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  private carregarDadosDashboard(): void {
    this.relatoService.listarRelatos().subscribe({
      next: (dados: any[]) => {
        if (dados) {
          const normalizar = (str: string) => (str || '')
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

          this.totalNovos = dados.filter(r => {
            const s = normalizar(r.status);
            return !s || s === 'pendente' || s === 'novo';
          }).length;

          this.emAndamento = dados.filter(r => {
            const s = normalizar(r.status);
            return s.includes('andamento');
          }).length;

          this.resolvidos = dados.filter(r => {
            const s = normalizar(r.status);
            return s.includes('concluid') || s.includes('resolvid');
          }).length;

          this.montarGraficoCategorias(dados);
          this.atualizarMapaCalor(dados);
        }
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.warn('API Offline no Dashboard.');
      }
    });
  }

  private atualizarMapaCalor(relatos: any[]): void {
    if (!this.map) return;

    const pontosCalor = relatos
      .filter(r => r.latitude && r.longitude)
      .map(r => [Number(r.latitude), Number(r.longitude), 2.0]);

    if (pontosCalor.length > 0) {
      if (this.heatLayer) {
        this.map.removeLayer(this.heatLayer);
      }

      this.heatLayer = (L as any).heatLayer(pontosCalor, {
        radius: 50,     
        blur: 25,       
        maxZoom: 17,
        max: 1.0,       
        gradient: {     
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.85: 'yellow',
          0.95: 'orange',
          1.0: 'magenta'
        }
      });

      this.heatLayer.addTo(this.map);
    }
  }

  private montarGraficoCategorias(relatos: any[]): void {
    const contagemCategorias: { [key: string]: number } = {};

    relatos.forEach(item => {
      const cat = this.formatarCategoria(item.categoria || 'Outros');
      contagemCategorias[cat] = (contagemCategorias[cat] || 0) + 1;
    });

    const labels = Object.keys(contagemCategorias);
    const valores = Object.values(contagemCategorias);

    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.canvasRef) return;

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'polarArea', 
      data: {
        labels: labels.length ? labels : ['Sem dados'],
        datasets: [{
          label: 'Quantidade de Ocorrências',
          data: valores.length ? valores : [0],
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(236, 72, 153, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, bottom: 20, left: 20, right: 20 }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 1, display: true, backdropColor: 'transparent', font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.08)' },
            angleLines: { color: 'rgba(0, 0, 0, 0.08)' }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 15, padding: 20 }
          }
        }
      }
    });
  }

  private formatarCategoria(categoria: string): string {
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
}