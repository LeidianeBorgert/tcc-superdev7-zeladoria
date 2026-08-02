import { Component, AfterViewInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
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
  imports: [CommonModule, ReactiveFormsModule,FormsModule], 
  templateUrl: './novo-relato.html',
  styleUrl: './novo-relato.scss',
  encapsulation: ViewEncapsulation.None
})
export class NovoRelatoComponent implements AfterViewInit, OnDestroy {

  @ViewChild('nomeInput') nomeInput!: ElementRef;

  private http = inject(HttpClient);

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  
  public etapaAtual: number = 1; 
  public ehAnonimo: boolean = false;
  public fotoPreview: string | null = null;
  public fotoArquivo: File | null = null;

  public termoBusca: string = '';

  public relatoForm: FormGroup;
  public displayLatitude: string = '-26.9166';
  public displayLongitude: string = '-49.0661';

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private relatoService: RelatoService) {
    this.relatoForm = this.fb.group({
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      latitude: ['-26.9166', Validators.required],
      longitude: ['-49.0661', Validators.required],
      nomeUsuario: ['', Validators.required], 
      foto: ['']
    });
  }
public buscarEnderecoNoMapa(): void {
    if (!this.termoBusca || !this.termoBusca.trim()) return;

    const buscaComCidade = `${this.termoBusca}, Blumenau`;
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(buscaComCidade)}&limit=1`;

    this.http.get<any>(url).subscribe({
      next: (resposta: any) => {
        if (resposta && resposta.features && resposta.features.length > 0) {
          const [lng, lat] = resposta.features[0].geometry.coordinates;

          this.atualizarCoordenadas(lat, lng);

          if (this.map) {
            this.map.setView([lat, lng], 16);
          }

          if (this.marker) {
            this.marker.setLatLng([lat, lng]);
          }
        } else {
          alert('Endereço não encontrado em Blumenau. Tente digitar com mais detalhes!');
        }
      },
      error: (err: any) => {
        console.error('Erro na pesquisa de endereço:', err);
        alert('Erro ao realizar a busca de endereço.');
      }
    });
  }
 
  public proximaEtapa(): void {

    if (this.etapaAtual === 2) {
      const categoriaInvalida = this.relatoForm.get('categoria')?.invalid;
      const descricaoInvalida = this.relatoForm.get('descricao')?.invalid;

      if (categoriaInvalida || descricaoInvalida) {
        this.relatoForm.get('categoria')?.markAsTouched();
        this.relatoForm.get('descricao')?.markAsTouched();
        return;
      }
    }
    if (this.etapaAtual < 4) {
      this.etapaAtual = this.etapaAtual + 1;
      
      this.cdr.detectChanges();

      if (this.etapaAtual === 4) {
        setTimeout(() => {
          if (this.nomeInput && !this.ehAnonimo) {
            this.nomeInput.nativeElement.focus();
          }
        }, 100);
      }
    }
  }

  public etapaAnterior(): void {
    if (this.etapaAtual > 1) {
      this.etapaAtual = this.etapaAtual - 1;
      
      this.cdr.detectChanges();
      if (this.etapaAtual === 1) {
        setTimeout(() => {
          this.initMap();
        }, 100);
      }
    }
  }

  public definirAnonimo(statusAnonimo: boolean): void {
    this.ehAnonimo = statusAnonimo;
    const nomeControl = this.relatoForm.get('nomeUsuario');

    if (statusAnonimo === true) {
      nomeControl?.clearValidators();
      nomeControl?.setValue('Anonymous');
    } else {
      nomeControl?.setValidators([Validators.required]);
      nomeControl?.setValue('');

      setTimeout(() => {
        if (this.nomeInput) {
          this.nomeInput.nativeElement.focus();
        }
      }, 100);
    }

    nomeControl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }
  public aoSelecionarFoto(event: any): void {
    const arquivo = event.target.files[0];
    if (arquivo) {
      this.fotoArquivo = arquivo;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
        this.relatoForm.patchValue({ foto: this.fotoPreview }); 
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(arquivo);
    }
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

public enviarRelatoCompleto(): void {
    if (this.relatoForm.invalid) {
      this.relatoForm.markAllAsTouched();
      return;
    }

    const dadosDoRelato = this.relatoForm.value;

    this.relatoService.salvarRelato(dadosDoRelato).subscribe({
      next: (resposta: any) => {
        alert('Relato salvo com sucesso no banco de dados!');
        this.relatoForm.reset(); 
        this.etapaAtual = 1; 
        this.fotoPreview = null;
        this.fotoArquivo = null;
        this.ehAnonimo = false;
        
        this.definirAnonimo(false);

        setTimeout(() => {
          this.initMap();
        }, 200);
      },
      error: (erro: any) => {
        console.error('Erro ao conectar na API:', erro);
        alert('Erro ao salvar o relato.');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}