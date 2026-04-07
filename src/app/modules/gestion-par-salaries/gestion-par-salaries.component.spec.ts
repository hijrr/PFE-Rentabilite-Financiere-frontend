import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionParSalariesComponent } from './gestion-par-salaries.component';

describe('GestionParSalariesComponent', () => {
  let component: GestionParSalariesComponent;
  let fixture: ComponentFixture<GestionParSalariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionParSalariesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionParSalariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
