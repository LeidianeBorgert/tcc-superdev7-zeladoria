import { Component, AfterViewInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { RelatoService } from '../../services/relato.service';
import * as L from 'leaflet';


L.Marker.prototype.options.icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

@Component({
  selector: 'app-novo-relato',
  standalone: true,

  imports: [CommonModule, ReactiveFormsModule], 
  template: `
    <div class="form-container">
      <h2 class="page-title">Registrar Nova Ocorrência</h2>
      <p class="page-subtitle">Informe os detalhes do problema urbano para que a equipe de manutenção possa agir.</p>

      <form class="relato-form" [formGroup]="relatoForm" (ngSubmit)="enviarRelato()">
        
        <div class="form-group">
          <label for="categoria">Categoria do Problema</label>
          <select 
            id="categoria" 
            class="form-control" 
            formControlName="categoria"
            [ngClass]="{ 'is-invalid': relatoForm.get('categoria')?.invalid && relatoForm.get('categoria')?.touched }"
          >
            <option value="" disabled selected>Selecione uma categoria...</option>
            <option value="buraco">Buraco na Via / Asfalto Danificado</option>
            <option value="iluminacao">Iluminação Pública (Lâmpada Queimada)</option>
            <option value="vazamento">Vazamento de Água / Esgoto</option>
            <option value="calçada">Calçada Danificada / Obstáculo</option>
            <option value="lixo">Descarte Irregular de Lixo / Entulho</option>
          </select>

          <div class="error-message" *ngIf="relatoForm.get('categoria')?.invalid && relatoForm.get('categoria')?.touched">
            A categoria é obrigatória.
          </div>
        </div>

        <div class="form-group">
          <label for="descricao">Descrição do Problema</label>
          <textarea 
            id="descricao" 
            rows="4" 
            class="form-control" 
            placeholder="Descreva com detalhes o que está acontecendo..." 
            formControlName="descricao"
            [ngClass]="{ 'is-invalid': relatoForm.get('descricao')?.invalid && relatoForm.get('descricao')?.touched }"
          ></textarea>

          <div class="error-message" *ngIf="relatoForm.get('descricao')?.invalid && relatoForm.get('descricao')?.touched">
            <span *ngIf="relatoForm.get('descricao')?.errors?.['required']">A descrição é obrigatória.</span>
            <span *ngIf="relatoForm.get('descricao')?.errors?.['minlength']">A descrição precisa ter pelo menos 10 caracteres.</span>
          </div>
        </div>

        <div class="coordinates-display">
          <div class="coord-box"><strong>Latitude:</strong> {{ displayLatitude }}</div>
          <div class="coord-box"><strong>Longitude:</strong> {{ displayLongitude }}</div>
        </div>

        <div class="form-group">
          <label>Selecione o Local no Mapa (Arraste o marcador 📍)</label>
          <div id="map" class="map-container-real"></div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="relatoForm.invalid">Enviar Relato</button>
        </div>
      </form>
    </div>
  `,
  styleUrl: './novo-relato.scss',
  encapsulation: ViewEncapsulation.None
})
export class NovoRelatoComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  
  public relatoForm: FormGroup;

  public displayLatitude: string = '-26.9166';
  public displayLongitude: string = '-49.0661';

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private relatoService: RelatoService) {
    this.relatoForm = this.fb.group({
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      latitude: ['-26.9166', Validators.required],
      longitude: ['-49.0661', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 200);
  }

  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    try {
      this.map = L.map('map', {
        center: [ -26.9166, -49.0661 ],
        zoom: 14
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.invalidateSize();

      this.marker = L.marker([ -26.9166, -49.0661 ], {
        draggable: true
      }).addTo(this.map);

      
      this.marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        this.atualizarCoordenadas(position.lat, position.lng);
      });

  
      this.map.on('click', (event: L.LeafletMouseEvent) => {
        if (this.marker) {
          this.marker.setLatLng(event.latlng);
          this.atualizarCoordenadas(event.latlng.lat, event.latlng.lng);
        }
      });

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Erro ao inicializar o Leaflet:', error);
    }
  }

  private atualizarCoordenadas(lat: number, lng: number): void {
    const latFormatada = lat.toFixed(6);
    const lngFormatada = lng.toFixed(6);
    
    this.displayLatitude = latFormatada;
    this.displayLongitude = lngFormatada;
    
    this.relatoForm.patchValue({
      latitude: latFormatada,
      longitude: lngFormatada
    });

    this.cdr.detectChanges();
  }

  public enviarRelato(): void {
    if (this.relatoForm.valid) {
      const dadosDoRelato = this.relatoForm.value;

      console.log('Disparando dados para o Service:', dadosDoRelato);

      this.relatoService.salvarRelato(dadosDoRelato).subscribe({
        next: (resposta) => {
          alert('Relato salvo com sucesso no banco de dados!');
          this.relatoForm.reset(); 
        },
        error: (erro) => {
          console.error('Erro ao conectar na API:', erro);
          alert('Os dados foram capturados, mas não conseguimos falar com a API Backend ainda. Verifique se a URL está correta ou se o servidor Backend está ligado!');
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}