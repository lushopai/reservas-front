import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabanasCatalogoComponent } from './cabanas-catalogo.component';

describe('CabanasCatalogoComponent', () => {
  let component: CabanasCatalogoComponent;
  let fixture: ComponentFixture<CabanasCatalogoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CabanasCatalogoComponent]
    });
    fixture = TestBed.createComponent(CabanasCatalogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
