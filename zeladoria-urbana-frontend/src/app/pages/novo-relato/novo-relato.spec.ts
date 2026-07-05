import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoRelato } from './novo-relato';

describe('NovoRelato', () => {
  let component: NovoRelato;
  let fixture: ComponentFixture<NovoRelato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoRelato],
    }).compileComponents();

    fixture = TestBed.createComponent(NovoRelato);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
