import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GrafikTamuPage } from './grafik-tamu.page';

describe('GrafikTamuPage', () => {
  let component: GrafikTamuPage;
  let fixture: ComponentFixture<GrafikTamuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GrafikTamuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
