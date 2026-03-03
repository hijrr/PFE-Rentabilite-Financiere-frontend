import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionSalariesComponent } from './gestion-salaries.component';

describe('GestionSalariesComponent', () => {
  let component: GestionSalariesComponent;
  let fixture: ComponentFixture<GestionSalariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionSalariesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionSalariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
