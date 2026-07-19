import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ListaOcorrenciasComponent } from './lista-ocorrencias';
import { RelatoService } from '../../services/relato.service';

describe('ListaOcorrenciasComponent', () => {
  let component: ListaOcorrenciasComponent;
  let fixture: ComponentFixture<ListaOcorrenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaOcorrenciasComponent],
      providers: [
        provideHttpClient(),
        RelatoService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaOcorrenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});