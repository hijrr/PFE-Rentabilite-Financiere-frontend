import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionFacturationComponent } from './gestion-facturation.component';

describe('GestionFacturationComponent', () => {
  let component: GestionFacturationComponent;
  let fixture: ComponentFixture<GestionFacturationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionFacturationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionFacturationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
