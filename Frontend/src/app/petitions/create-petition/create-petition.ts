import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { PetitionService, CreatePetitionRequest } from '../../core/petition.service';

@Component({
  selector: 'app-create-petition',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './create-petition.html',

  styleUrl: './create-petition.scss',
})
export class CreatePetition {
  title = '';

  description = '';

  category = '';

  location = '';

  signatureLimit: number | null = null;

  loading = false;

  errorMessage = '';

  signatureLimits = [10, 50, 100];

  categories = [
    'Environment',

    'Infrastructure',

    'Education',

    'Public Safety',

    'Transportation',

    'Healthcare',

    'Housing',
  ];

  constructor(
    private petitionService: PetitionService,

    private router: Router,
  ) {}

  // =====================================================
  // BACK
  // =====================================================

  goBack(): void {
    if (this.loading) {
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(): void {
    /*
     * Clear previous error.
     */

    this.errorMessage = '';

    /*
     * Trim values.
     */

    this.title = this.title.trim();

    this.description = this.description.trim();

    this.location = this.location.trim();

    /*
     * Frontend validation.
     */

    if (!this.title) {
      this.errorMessage = 'Please enter a petition title.';

      return;
    }

    if (!this.description) {
      this.errorMessage = 'Please enter a petition description.';

      return;
    }

    if (!this.category) {
      this.errorMessage = 'Please select a category.';

      return;
    }

    if (!this.location) {
      this.errorMessage = 'Please enter a location.';

      return;
    }

    if (this.signatureLimit === null) {
      this.errorMessage = 'Please select a signature limit.';

      return;
    }

    /*
     * Prevent double submission.
     */

    if (this.loading) {
      return;
    }

    this.loading = true;

    const payload: CreatePetitionRequest = {
      title: this.title,

      description: this.description,

      category: this.category,

      location: this.location,

      signatureLimit: this.signatureLimit,
    };

    console.log('Submitting petition...', payload);

    this.petitionService.createPetition(payload).subscribe({
      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      next: (response) => {
        console.log('Petition created:', response);

        this.loading = false;

        /*
         * Navigate only after successful
         * backend response.
         */

        this.router.navigate(['/dashboard']);
      },

      // -----------------------------------------------
      // ERROR
      // -----------------------------------------------

      error: (err) => {
        console.error('Petition creation failed:', err);

        this.loading = false;

        /*
         * Display actual backend message.
         */

        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.status === 0) {
          this.errorMessage =
            'Cannot connect to the backend. Make sure the Civix server is running on port 5000.';
        } else if (err?.status === 401) {
          this.errorMessage = 'Your login session has expired. Please login again.';
        } else {
          this.errorMessage = 'Failed to create petition. Please try again.';
        }
      },
    });
  }
}
