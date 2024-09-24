import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginscreenComponent } from './loginscreen.component';

describe('LoginscreenComponent', () => {
  let component: LoginscreenComponent;
  let fixture: ComponentFixture<LoginscreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginscreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
