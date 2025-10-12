import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservasListComponent } from './reservas-list.component';

describe('ReservasListComponent', () => {
  let component: ReservasListComponent;
  let fixture: ComponentFixture<ReservasListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReservasListComponent]
    });
    fixture = TestBed.createComponent(ReservasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
