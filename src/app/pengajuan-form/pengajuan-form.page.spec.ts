import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PengajuanFormPage } from './pengajuan-form.page';

describe('PengajuanFormPage', () => {
  let component: PengajuanFormPage;
  let fixture: ComponentFixture<PengajuanFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PengajuanFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
