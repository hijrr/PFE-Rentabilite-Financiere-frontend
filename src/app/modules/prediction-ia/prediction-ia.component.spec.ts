import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionIAComponent } from './prediction-ia.component';

describe('PredictionIAComponent', () => {
  let component: PredictionIAComponent;
  let fixture: ComponentFixture<PredictionIAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PredictionIAComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionIAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
