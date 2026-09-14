import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePetition } from './create-petition';

describe('CreatePetition', () => {
  let component: CreatePetition;
  let fixture: ComponentFixture<CreatePetition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePetition],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePetition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
