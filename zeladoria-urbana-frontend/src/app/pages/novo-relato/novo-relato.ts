import { Component, AfterViewInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { RelatoService } from '../../services/relato.service';
import { ListaOcorrenciasService } from '../../services/lista-ocorrencias.service';

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
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private listaOcorrenciasService: ListaOcorrenciasService = inject(ListaOcorrenciasService);

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  
  public etapaAtual: number = 1; 
  public ehAnonimo: boolean = false;
  public fotoPreview: string | null = null;
  public fotoArquivo: File | null = null;

  public termoBusca: string = '';

  public relatoForm: FormGroup;
  public displayLatitude: string = '-26.916600';
  public displayLongitude: string = '-49.066100';

  public nomeArquivoSelecionado: string = '';

  public mensagemNotificacao: string | null = null;
  public tipoNotificacao: 'sucesso' | 'erro' = 'sucesso';

  public modoEdicao: boolean = false;
  public ocorrenciaId: number | null = null;

  constructor(
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef, 
    private relatoService: RelatoService
  ) {
    const usuarioStorage = localStorage.getItem('usuario_logado') || localStorage.getItem('usuarioLogado') || localStorage.getItem('user');
    let nomePadrao = '';

    if (usuarioStorage) {
      try {
        const usuarioObj = JSON.parse(usuarioStorage);
        nomePadrao = usuarioObj?.nome || usuarioObj?.usuario_nome || '';
      } catch (e) {
        console.warn('Erro ao ler usuário do localStorage:', e);
      }
    }

    this.relatoForm = this.fb.group({
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      latitude: ['-26.9166', Validators.required],
      longitude: ['-49.0661', Validators.required],
      endereco: [''],
      nomeUsuario: [nomePadrao, [Validators.required, Validators.minLength(3), Validators.maxLength(100)]], 
      foto: ['']
    });
  }

  ngAfterViewInit(): void {
    setTimeout((): void => {
      this.initMap();

      this.route.queryParams.subscribe(params => {
        if (params['id']) {
          this.modoEdicao = true;
          this.ocorrenciaId = +params['id'];
          this.carregarDadosParaEdicao(this.ocorrenciaId);
        }
      });
    }, 200);
  }

  private carregarDadosParaEdicao(id: number): void {
    this.listaOcorrenciasService.obterOcorrencias().subscribe({
      next: (dados: any[]) => {
        const item = dados.find(o => o.id === id);
        if (item) {
          const lat = parseFloat(item.latitude) || -26.9166;
          const lng = parseFloat(item.longitude) || -49.0661;

          this.relatoForm.patchValue({
            categoria: item.categoria,
            descricao: item.descricao,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            foto: item.foto || item.imagem || '',
            nomeUsuario: item.usuario_nome || this.relatoForm.get('nomeUsuario')?.value
          });

          if (item.foto || item.imagem) {
            this.fotoPreview = item.foto || item.imagem;
          }

          if (item.usuario_nome === 'Anônimo' || item.usuario_nome === 'Anonymous') {
            this.definirAnonimo(true);
          }

          this.atualizarCoordenadas(lat, lng);
          if (this.map) {
            this.map.setView([lat, lng], 16);
          }
          if (this.marker) {
            this.marker.setLatLng([lat, lng]);
          }

          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erro ao carregar dados da ocorrência para edição:', err)
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

  public limparBusca(): void {
    this.termoBusca = '';
    const latPadrao = -26.9166;
    const lngPadrao = -49.0661;

    if (this.map) {
      this.map.setView([latPadrao, lngPadrao], 14);
    }

    if (this.marker) {
      this.marker.setLatLng([latPadrao, lngPadrao]);
    }

    this.atualizarCoordenadas(latPadrao, lngPadrao);
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

  private initMap(): void {
    const mapElement: HTMLElement | null = document.getElementById('map');
    if (!mapElement || this.map) return; 

    try {
      const initialLat = parseFloat(this.relatoForm.get('latitude')?.value) || -26.9166;
      const initialLng = parseFloat(this.relatoForm.get('longitude')?.value) || -49.0661;

      this.map = L.map('map', {
        center: [initialLat, initialLng],
        zoom: 14
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.invalidateSize();

      this.marker = L.marker([initialLat, initialLng], {
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

      this.atualizarCoordenadas(initialLat, initialLng);

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

    this.obterEnderecoTexto(latFormatada, lngFormatada);
    this.cdr.detectChanges();
  }

  private obterEnderecoTexto(lat: string, lon: string): void {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;

    this.http.get<any>(url).subscribe({
      next: (resposta: any): void => {
        if (resposta && resposta.features && resposta.features.length > 0) {
          const props = resposta.features[0].properties;
          const rua = props.name || props.street || props.road || 'Rua não cadastrada';
          let bairro = props.locality || props.suburb || props.neighbourhood || 'Blumenau';

          const enderecoCompleto = `${rua} - ${bairro}`;
          this.relatoForm.patchValue({ endereco: enderecoCompleto });
        } else {
          this.relatoForm.patchValue({ endereco: `Lat: ${lat}, Lon: ${lon}` });
        }
        this.cdr.detectChanges();
      },
      error: (): void => {
        this.relatoForm.patchValue({ endereco: `Lat: ${lat}, Lon: ${lon}` });
        this.cdr.detectChanges();
      }
    });
  }

  public enviarRelatoCompleto(): void {
    if (this.relatoForm.invalid) {
      this.relatoForm.markAllAsTouched();
      return;
    }

    const formValue = this.relatoForm.value;
    
    const dadosDoRelato = {
      categoria: formValue.categoria,
      descricao: formValue.descricao,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      foto: formValue.foto || null,
      usuario_nome: this.ehAnonimo ? 'Anônimo' : (formValue.nomeUsuario || 'Anônimo')
    };

    if (this.modoEdicao && this.ocorrenciaId) {
      this.relatoService.editarRelato(this.ocorrenciaId, dadosDoRelato as any).subscribe({
        next: (): void => {
          this.exibirNotificacao('Relato atualizado com sucesso!', 'sucesso');
          setTimeout(() => this.router.navigate(['/meu-perfil']), 1500);
        },
        error: (erro: any): void => {
          console.error('Erro ao atualizar o relato:', erro);
          this.exibirNotificacao('Erro ao atualizar o relato. Tente novamente!', 'erro');
        }
      });
    } else {
      this.relatoService.salvarRelato(dadosDoRelato).subscribe({
        next: (): void => {
          this.exibirNotificacao('Relato salvo com sucesso no banco de dados!', 'sucesso');
          
          this.relatoForm.reset(); 
          this.etapaAtual = 1; 
          this.fotoPreview = null;
          this.fotoArquivo = null;
          this.nomeArquivoSelecionado = '';
          this.ehAnonimo = false;
          
          this.definirAnonimo(false);

          setTimeout((): void => {
            if (this.map) {
              this.map.remove();
              this.map = undefined;
            }
            this.initMap();
          }, 200);
        },
        error: (erro: any): void => {
          console.error('Erro ao conectar na API:', erro);
          this.exibirNotificacao('Erro ao salvar o relato. Tente novamente!', 'erro');
        }
      });
    }
  }

  private exibirNotificacao(mensagem: string, tipo: 'sucesso' | 'erro'): void {
    this.mensagemNotificacao = mensagem;
    this.tipoNotificacao = tipo;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.mensagemNotificacao = null;
      this.cdr.detectChanges();
    }, 4000); 
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}