import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserMenuPage } from './user-menu.page';

describe('UserMenuPage', () => {
  let component: UserMenuPage;
  let fixture: ComponentFixture<UserMenuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
