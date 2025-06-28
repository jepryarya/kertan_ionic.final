import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDataTamuPage } from './admin-data-tamu.page';

describe('AdminDataTamuPage', () => {
  let component: AdminDataTamuPage;
  let fixture: ComponentFixture<AdminDataTamuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDataTamuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
