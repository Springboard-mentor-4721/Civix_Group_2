import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

const API_BASE_URL = 'http://localhost:5000/api';

interface Petition {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: 'active' | 'under_review' | 'closed';
}

interface PetitionWithSignature extends Petition {
  signed: boolean;
  signatureCount: number;
  signing: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  categories = [
    'All Categories',
    'Environment',
    'Infrastructure',
    'Education',
    'Public Safety',
    'Transportation',
    'Healthcare',
    'Housing'
  ];

  selectedCategory = 'All Categories';

  location = 'San Diego, CA';

  // Location filter input
  locationFilter = '';

  allPetitions: PetitionWithSignature[] = [];
  petitions: PetitionWithSignature[] = [];

  myPetitionsCount = 0;
  successfulPetitionsCount = 0;
  pollsCreatedCount = 0;

  currentUserId!: number;
  userName = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    const user = this.authService.currentUser;

    this.currentUserId = Number(user?.id);
    this.userName = user?.name ?? '';
    this.location = user?.location ?? this.location;

    this.selectedCategory = 'All Categories';
    this.locationFilter = '';

    this.loadPetitions();
  }

  /*
   * LOAD PETITIONS
   */
  loadPetitions(): void {

    this.http
      .get<{ count: number; petitions: Petition[] }>(
        `${API_BASE_URL}/petitions`
      )
      .subscribe({

        next: (res) => {

          const receivedPetitions = res.petitions || [];

          this.allPetitions = receivedPetitions.map(
            petition => ({
              ...petition,
              signed: false,
              signatureCount: 0,
              signing: false
            })
          );

          this.applyFilters();

          this.myPetitionsCount = this.allPetitions.filter(
            petition =>
              Number(petition.creator_id) === this.currentUserId
          ).length;

          this.successfulPetitionsCount = this.allPetitions.filter(
            petition =>
              Number(petition.creator_id) === this.currentUserId &&
              petition.status === 'closed'
          ).length;

          this.changeDetectorRef.detectChanges();

          this.loadSignatureStatuses();
        },

        error: (err) => {

          console.error(
            'Failed to load petitions:',
            err
          );

          this.allPetitions = [];
          this.petitions = [];

          this.myPetitionsCount = 0;
          this.successfulPetitionsCount = 0;

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  /*
   * LOAD SIGNATURE STATUS
   */
  loadSignatureStatuses(): void {

    for (const petition of this.allPetitions) {

      this.http
        .get<{
          signed: boolean;
          signatureCount: number;
        }>(
          `${API_BASE_URL}/petitions/${petition.id}/sign`
        )
        .subscribe({

          next: (res) => {

            const targetPetition =
              this.allPetitions.find(
                p => Number(p.id) === Number(petition.id)
              );

            if (!targetPetition) {
              return;
            }

            targetPetition.signed =
              Boolean(res.signed);

            targetPetition.signatureCount =
              Number(res.signatureCount || 0);

            this.changeDetectorRef.detectChanges();
          },

          error: (err) => {

            console.error(
              `Failed to check signature for petition ${petition.id}:`,
              err
            );

            const targetPetition =
              this.allPetitions.find(
                p => Number(p.id) === Number(petition.id)
              );

            if (!targetPetition) {
              return;
            }

            targetPetition.signed = false;
            targetPetition.signatureCount = 0;

            this.changeDetectorRef.detectChanges();
          }
        });
    }
  }

  /*
   * SIGN PETITION
   */
  signPetition(
    petition: PetitionWithSignature
  ): void {

    if (petition.signing) {
      return;
    }

    if (petition.signed) {
      return;
    }

    if (petition.status !== 'active') {
      return;
    }

    petition.signing = true;

    this.changeDetectorRef.detectChanges();

    this.http
      .post<{
        message: string;
        signatureCount: number;
      }>(
        `${API_BASE_URL}/petitions/${petition.id}/sign`,
        {}
      )
      .subscribe({

        next: (res) => {

          petition.signed = true;

          petition.signatureCount =
            Number(
              res.signatureCount ??
              petition.signatureCount + 1
            );

          petition.signing = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (err) => {

          console.error(
            'Failed to sign petition:',
            err
          );

          petition.signing = false;

          const message =
            err?.error?.message ||
            'Failed to sign petition';

          alert(message);

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  /*
   * UNSIGN PETITION
   */
  unsignPetition(
    petition: PetitionWithSignature
  ): void {

    if (petition.signing) {
      return;
    }

    if (!petition.signed) {
      return;
    }

    petition.signing = true;

    this.changeDetectorRef.detectChanges();

    this.http
      .delete<{
        message: string;
        signatureCount: number;
      }>(
        `${API_BASE_URL}/petitions/${petition.id}/sign`
      )
      .subscribe({

        next: (res) => {

          petition.signed = false;

          petition.signatureCount =
            Math.max(
              0,
              Number(
                res.signatureCount ??
                petition.signatureCount - 1
              )
            );

          petition.signing = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (err) => {

          console.error(
            'Failed to remove signature:',
            err
          );

          petition.signing = false;

          const message =
            err?.error?.message ||
            'Failed to remove signature';

          alert(message);

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  /*
   * APPLY CATEGORY + LOCATION FILTERS
   */
  applyFilters(): void {

    const selectedCategory =
      this.selectedCategory
        .trim()
        .toLowerCase();

    const selectedLocation =
      this.locationFilter
        .trim()
        .toLowerCase();

    this.petitions =
      this.allPetitions.filter(petition => {

        /*
         * Category condition
         */
        const categoryMatches =
          selectedCategory === 'all categories' ||
          (
            petition.category &&
            petition.category
              .trim()
              .toLowerCase() === selectedCategory
          );

        /*
         * Location condition
         */
        const locationMatches =
          !selectedLocation ||
          (
            petition.location &&
            petition.location
              .trim()
              .toLowerCase()
              .includes(selectedLocation)
          );

        /*
         * Both conditions must match
         */
        return categoryMatches && locationMatches;
      });

    this.changeDetectorRef.detectChanges();
  }

  /*
   * SELECT CATEGORY
   */
  selectCategory(category: string): void {

    this.selectedCategory = category;

    this.applyFilters();
  }

  /*
   * CLEAR LOCATION FILTER
   */
  clearLocationFilter(): void {

    this.locationFilter = '';

    this.applyFilters();
  }

  /*
   * CLEAR ALL FILTERS
   */
  clearFilters(): void {

    this.selectedCategory = 'All Categories';
    this.locationFilter = '';

    this.petitions = [
      ...this.allPetitions
    ];

    this.changeDetectorRef.detectChanges();
  }

  /*
   * LOGOUT
   */
  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);
  }
}