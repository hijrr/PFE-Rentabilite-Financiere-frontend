import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceImportComponentComponent } from './finance-import-component.component';

describe('FinanceImportComponentComponent', () => {
  let component: FinanceImportComponentComponent;
  let fixture: ComponentFixture<FinanceImportComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinanceImportComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanceImportComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
