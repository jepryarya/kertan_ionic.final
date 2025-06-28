import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilRtPage } from './profil-rt.page';

describe('ProfilRtPage', () => {
  let component: ProfilRtPage;
  let fixture: ComponentFixture<ProfilRtPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilRtPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
