import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicNavbarComponent } from './public-navbar.component';

describe('PublicNavbarComponent', () => {
  let component: PublicNavbarComponent;
  let fixture: ComponentFixture<PublicNavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PublicNavbarComponent]
    });
    fixture = TestBed.createComponent(PublicNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
