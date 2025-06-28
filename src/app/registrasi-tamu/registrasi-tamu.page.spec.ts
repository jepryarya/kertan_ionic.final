import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrasiTamuPage } from './registrasi-tamu.page';

describe('RegistrasiTamuPage', () => {
  let component: RegistrasiTamuPage;
  let fixture: ComponentFixture<RegistrasiTamuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrasiTamuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
