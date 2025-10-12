import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioDetailComponent } from './usuario-detail.component';

describe('UsuarioDetailComponent', () => {
  let component: UsuarioDetailComponent;
  let fixture: ComponentFixture<UsuarioDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UsuarioDetailComponent]
    });
    fixture = TestBed.createComponent(UsuarioDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
