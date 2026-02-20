import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialDataFormComponentComponent } from './financial-data-form-component.component';

describe('FinancialDataFormComponentComponent', () => {
  let component: FinancialDataFormComponentComponent;
  let fixture: ComponentFixture<FinancialDataFormComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinancialDataFormComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialDataFormComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
