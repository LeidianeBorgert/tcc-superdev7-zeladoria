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
  imports: [CommonModule, ReactiveFormsModule, FormsModule], 
  templateUrl: './novo-relato.html',
  styleUrl: './novo-relato.scss',
  encapsulation: ViewEncapsulation.None
})
export class NovoRelatoComponent implements AfterViewInit, OnDestroy {

  @ViewChild('nomeInput') nomeInput!: ElementRef;

  private http: HttpClient = inject(HttpClient);

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

  public nomeArquivoSelecionado: string = '';

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private relatoService: RelatoService) {
    this.relatoForm = this.fb.group({
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      latitude: ['-26.9166', Validators.required],
      longitude: ['-49.0661', Validators.required],
      nomeUsuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]], 
      foto: ['']
    });
  }

  public aoSelecionarFoto(event: Event): void {
    const inputTarget = event.target as HTMLInputElement;
    if (inputTarget.files && inputTarget.files.length > 0) {
      const arquivo: File = inputTarget.files[0];
      this.fotoArquivo = arquivo;
      this.nomeArquivoSelecionado = arquivo.name;
      
      const reader: FileReader = new FileReader();
      reader.onload = (): void => {
        this.fotoPreview = reader.result as string;
        this.relatoForm.patchValue({ foto: this.fotoPreview }); 
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(arquivo);
    }
  }

  public buscarEnderecoNoMapa(): void {
    if (!this.termoBusca || !this.termoBusca.trim()) return;

    const buscaComCidade: string = `${this.termoBusca}, Blumenau`;
    const url: string = `https://photon.komoot.io/api/?q=${encodeURIComponent(buscaComCidade)}&limit=1`;

    this.http.get<any>(url).subscribe({
      next: (resposta: any): void => {
        if (resposta && resposta.features && resposta.features.length > 0) {
          const [lng, lat]: [number, number] = resposta.features[0].geometry.coordinates;

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
      error: (err: any): void => {
        console.error('Erro na pesquisa de endereço:', err);
        alert('Erro ao realizar a busca de endereço.');
      }
    });
  }

  public proximaEtapa(): void {
    if (this.etapaAtual === 2) {
      const categoriaInvalida: boolean | undefined = this.relatoForm.get('categoria')?.invalid;
      const descricaoInvalida: boolean | undefined = this.relatoForm.get('descricao')?.invalid;

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
        setTimeout((): void => {
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
        setTimeout((): void => {
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
      nomeControl?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
      nomeControl?.setValue('');

      setTimeout((): void => {
        if (this.nomeInput) {
          this.nomeInput.nativeElement.focus();
        }
      }, 100);
    }

    nomeControl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    setTimeout((): void => {
      this.initMap();
    }, 200);
  }

  private initMap(): void {
    const mapElement: HTMLElement | null = document.getElementById('map');
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

      this.marker.on('dragend', (event: L.LeafletEvent): void => {
        const position: L.LatLng = (event.target as L.Marker).getLatLng();
        this.atualizarCoordenadas(position.lat, position.lng);
      });

      this.map.on('click', (event: L.LeafletMouseEvent): void => {
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
    const latFormatada: string = lat.toFixed(6);
    const lngFormatada: string = lng.toFixed(6);
    
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
      next: (resposta: any): void => {
        alert('Relato salvo com sucesso no banco de dados!');
        this.relatoForm.reset(); 
        this.etapaAtual = 1; 
        this.fotoPreview = null;
        this.fotoArquivo = null;
        this.nomeArquivoSelecionado = '';
        this.ehAnonimo = false;
        
        this.definirAnonimo(false);

        setTimeout((): void => {
          this.initMap();
        }, 200);
      },
      error: (erro: any): void => {
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