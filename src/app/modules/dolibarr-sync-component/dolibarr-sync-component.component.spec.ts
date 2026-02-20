import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DolibarrSyncComponentComponent } from './dolibarr-sync-component.component';

describe('DolibarrSyncComponentComponent', () => {
  let component: DolibarrSyncComponentComponent;
  let fixture: ComponentFixture<DolibarrSyncComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DolibarrSyncComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DolibarrSyncComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
