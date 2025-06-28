import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilSatpamPage } from './profil-satpam.page';

describe('ProfilSatpamPage', () => {
  let component: ProfilSatpamPage;
  let fixture: ComponentFixture<ProfilSatpamPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilSatpamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
