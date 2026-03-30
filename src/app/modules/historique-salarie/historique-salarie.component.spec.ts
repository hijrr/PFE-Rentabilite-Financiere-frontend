import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueSalarieComponent } from './historique-salarie.component';

describe('HistoriqueSalarieComponent', () => {
  let component: HistoriqueSalarieComponent;
  let fixture: ComponentFixture<HistoriqueSalarieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistoriqueSalarieComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueSalarieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
