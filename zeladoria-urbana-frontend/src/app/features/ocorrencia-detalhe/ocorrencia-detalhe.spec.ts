import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcorrenciaDetalheComponent } from './ocorrencia-detalhe';

describe('OcorrenciaDetalheComponent', () => {
  let component: OcorrenciaDetalheComponent;
  let fixture: ComponentFixture<OcorrenciaDetalheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcorrenciaDetalheComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OcorrenciaDetalheComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
