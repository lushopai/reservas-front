import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosCatalogoComponent } from './servicios-catalogo.component';

describe('ServiciosCatalogoComponent', () => {
  let component: ServiciosCatalogoComponent;
  let fixture: ComponentFixture<ServiciosCatalogoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ServiciosCatalogoComponent]
    });
    fixture = TestBed.createComponent(ServiciosCatalogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
