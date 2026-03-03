import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculRenMainComponent } from './calcul-ren-main.component';

describe('CalculRenMainComponent', () => {
  let component: CalculRenMainComponent;
  let fixture: ComponentFixture<CalculRenMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalculRenMainComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculRenMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
