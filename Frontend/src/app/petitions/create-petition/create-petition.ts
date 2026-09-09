import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetitionService } from '../../core/petition.service';

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
    'Housing'
  ];

  constructor(
    private petitionService: PetitionService,
    private router: Router
  ) { }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (
      !this.title.trim() ||
      !this.description.trim() ||
      !this.category ||
      !this.location.trim() ||
      this.signatureLimit === null
    ) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    this.loading = true;

    this.petitionService
      .createPetition({
        title: this.title.trim(),
        description: this.description.trim(),
        category: this.category,
        location: this.location.trim(),
        signatureLimit: this.signatureLimit,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },

        error: (err: any) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message || 'Failed to create petition';
        },
      });
  }
}