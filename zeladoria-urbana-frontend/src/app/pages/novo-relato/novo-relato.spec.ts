import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoRelatoComponent } from './novo-relato';

describe('NovoRelatoComponent', () => {
  let component: NovoRelatoComponent;
  let fixture: ComponentFixture<NovoRelatoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoRelatoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NovoRelatoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});