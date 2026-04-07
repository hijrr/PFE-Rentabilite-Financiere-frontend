import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionParPeriodeComponent } from './gestion-par-periode.component';

describe('GestionParPeriodeComponent', () => {
  let component: GestionParPeriodeComponent;
  let fixture: ComponentFixture<GestionParPeriodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionParPeriodeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionParPeriodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
