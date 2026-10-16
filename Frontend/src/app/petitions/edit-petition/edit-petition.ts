import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const API_BASE_URL = 'http://localhost:5000/api';

interface Petition {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: 'active' | 'under_review' | 'closed';
  signatureLimit?: number;
}

@Component({
  selector: 'app-edit-petition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-petition.html',
  styleUrl: './edit-petition.scss',
})
export class EditPetition implements OnInit {

  petitionId!: number;

  title = '';
  description = '';
  category = '';
  location = '';

  status: 'active' | 'under_review' | 'closed' = 'active';

  // Signature limit
  signatureLimit = 10;

  signatureLimits = [10, 50, 100];

  loading = false;
  saving = false;
  errorMessage = '';

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
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!id || isNaN(id)) {
      this.errorMessage = 'Invalid petition ID';
      return;
    }

    this.petitionId = id;

    this.loadPetition();
  }

  loadPetition(): void {

    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<Petition | {
        petition: Petition;
        signatureCount: number;
      }>(
        `${API_BASE_URL}/petitions/${this.petitionId}`
      )
      .subscribe({

        next: (res) => {

          console.log(
            'Petition API response:',
            res
          );

          const petition = 'petition' in res ? res.petition : res;

          if (!petition) {

            this.loading = false;

            this.errorMessage =
              'Petition data not found';

            this.changeDetectorRef.detectChanges();

            return;
          }

          this.title =
            petition.title || '';

          this.description =
            petition.description || '';

          this.category =
            petition.category || '';

          this.location =
            petition.location || '';

          this.status =
            petition.status || 'active';

          /*
           * Backend may not have signatureLimit yet.
           * Default value will remain 10.
           */
          this.signatureLimit =
            petition.signatureLimit || 10;

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (err) => {

          console.error(
            'Failed to load petition:',
            err
          );

          this.loading = false;

          this.errorMessage = err?.status === 401
            ? 'Your session has expired. Please log in again.'
            : err?.error?.message || 'Failed to load petition';

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  onSubmit(): void {

    this.errorMessage = '';

    if (
      !this.title.trim() ||
      !this.description.trim() ||
      !this.category ||
      !this.location.trim()
    ) {

      this.errorMessage =
        'Please fill all fields';

      return;
    }

    if (!this.signatureLimit) {

      this.errorMessage =
        'Please select a signature limit';

      return;
    }

    this.saving = true;

    const payload = {

      title: this.title.trim(),

      description:
        this.description.trim(),

      category:
        this.category,

      location:
        this.location.trim(),

      status:
        this.status,

      signatureLimit:
        this.signatureLimit
    };

    console.log(
      'Updating petition:',
      payload
    );

    this.http
      .put(
        `${API_BASE_URL}/petitions/${this.petitionId}`,
        payload
      )
      .subscribe({

        next: (res) => {

          console.log(
            'Petition updated successfully:',
            res
          );

          this.saving = false;

          this.changeDetectorRef.detectChanges();

          this.router.navigate([
            '/dashboard'
          ]);
        },

        error: (err) => {

          console.error(
            'Failed to update petition:',
            err
          );

          this.saving = false;

          this.errorMessage =
            err?.error?.message ||
            'Failed to update petition';

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  cancel(): void {

    this.router.navigate([
      '/dashboard'
    ]);
  }
}