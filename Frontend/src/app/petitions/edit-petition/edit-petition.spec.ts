import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPetition } from './edit-petition';

describe('EditPetition', () => {
  let component: EditPetition;
  let fixture: ComponentFixture<EditPetition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPetition],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPetition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
