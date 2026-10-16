import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

const API_BASE_URL = 'http://localhost:5000/api';

/*
 * =========================================================
 * PETITION INTERFACE
 * =========================================================
 */

interface Petition {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: 'active' | 'under_review' | 'closed';

  // Optional because older petitions may not have it
  signatureLimit?: number;

  // Backend returns this field
  signatureCount?: number;
  latestResponse?: {
    comment: string;
    status: 'active' | 'under_review' | 'closed';
    createdAt: string;
  } | null;
}


/*
 * =========================================================
 * PETITION WITH FRONTEND STATE
 * =========================================================
 */

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

  /*
   * =========================================================
   * CATEGORIES
   * =========================================================
   */

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


  /*
   * =========================================================
   * USER LOCATION
   * =========================================================
   */

  location = 'San Diego, CA';

  // Manual location filter
  locationFilter = '';

  // Search input
  searchQuery = '';


  /*
   * =========================================================
   * PETITIONS
   * =========================================================
   */

  allPetitions: PetitionWithSignature[] = [];

  petitions: PetitionWithSignature[] = [];


  /*
   * =========================================================
   * CITIZEN STATISTICS
   * =========================================================
   */

  myPetitionsCount = 0;

  successfulPetitionsCount = 0;

  pollsCreatedCount = 0;


  /*
   * =========================================================
   * OFFICIAL STATISTICS
   * =========================================================
   */

  localPetitionsCount = 0;

  underReviewCount = 0;

  closedPetitionsCount = 0;


  /*
   * =========================================================
   * CURRENT USER
   * =========================================================
   */

  currentUserId!: number;

  userName = '';

  userRole = '';


  /*
   * =========================================================
   * CONSTRUCTOR
   * =========================================================
   */

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) { }


  /*
   * =========================================================
   * INITIALIZATION
   * =========================================================
   */

  ngOnInit(): void {

    const user = this.authService.currentUser;

    this.currentUserId = Number(user?.id);

    this.userName = user?.name ?? '';

    this.userRole = user?.role ?? '';

    this.location = user?.location ?? this.location;

    this.selectedCategory = 'All Categories';

    this.locationFilter = '';

    this.searchQuery = '';

    this.loadPollStats();
    this.loadPetitions();
  }


  /*
   * =========================================================
   * CHECK USER ROLE
   * =========================================================
   */

  isCitizen(): boolean {
    return this.userRole === 'citizen';
  }


  isOfficial(): boolean {
    return this.userRole === 'official';
  }


  /*
   * =========================================================
   * LOAD PETITIONS
   *
   * IMPORTANT:
   * Backend currently returns:
   *
   * [
   *   {
   *      id: 6,
   *      title: "...",
   *      ...
   *   }
   * ]
   *
   * NOT:
   *
   * {
   *    count: 2,
   *    petitions: [...]
   * }
   * =========================================================
   */

  loadPollStats(): void {
    if (!this.currentUserId) {
      this.pollsCreatedCount = 0;
      return;
    }

    this.http
      .get<any[]>(`${API_BASE_URL}/polls?created_by=${this.currentUserId}`)
      .subscribe({
        next: (polls) => {
          this.pollsCreatedCount = Array.isArray(polls) ? polls.length : 0;
          this.changeDetectorRef.detectChanges();
        },
        error: () => {
          this.pollsCreatedCount = 0;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  loadPetitions(): void {

    console.log('Loading petitions...');

    const petitionsUrl = this.isOfficial()
      ? `${API_BASE_URL}/governance/petitions`
      : `${API_BASE_URL}/petitions`;

    this.http
      .get<Petition[] | { count: number; petitions: Petition[] }>(petitionsUrl)
      .subscribe({

        /*
         * =====================================================
         * SUCCESS
         * =====================================================
         */

        next: (res) => {

          console.log(
            'Petitions received from API:',
            res
          );


          const receivedPetitions =
            Array.isArray(res)
              ? res
              : (Array.isArray(res?.petitions) ? res.petitions : []);


          /*
           * Convert backend petitions into
           * frontend PetitionWithSignature objects.
           */

          this.allPetitions =
            receivedPetitions.map(
              (petition) => ({

                ...petition,

                signed: false,

                /*
                 * Use signatureCount returned by backend.
                 */

                signatureCount:
                  Number(
                    petition.signatureCount ?? 0
                  ),

                signing: false

              })
            );


          console.log(
            'Petitions loaded into dashboard:',
            this.allPetitions
          );


          /*
           * Calculate statistics
           */

          this.calculateStatistics();
          this.loadPollStats();

          /*
           * Apply filters
           */

          this.applyFilters();


          /*
           * Force Angular UI update
           */

          this.changeDetectorRef.detectChanges();


          /*
           * Load individual signature status
           * for citizens.
           */

          if (this.isCitizen()) {

            this.loadSignatureStatuses();

          }

        },


        /*
         * =====================================================
         * ERROR
         * =====================================================
         */

        error: (err) => {

          console.error(
            'Failed to load petitions:',
            err
          );


          /*
           * Clear petition data
           */

          this.allPetitions = [];

          this.petitions = [];


          /*
           * Reset citizen statistics
           */

          this.myPetitionsCount = 0;

          this.successfulPetitionsCount = 0;

          this.pollsCreatedCount = 0;


          /*
           * Reset official statistics
           */

          this.localPetitionsCount = 0;

          this.underReviewCount = 0;

          this.closedPetitionsCount = 0;


          /*
           * Update UI
           */

          this.changeDetectorRef.detectChanges();

        }

      });

  }


  /*
   * =========================================================
   * CALCULATE STATISTICS
   * =========================================================
   */

  calculateStatistics(): void {


    /*
     * =======================================================
     * CITIZEN STATISTICS
     * =======================================================
     */

    this.myPetitionsCount =
      this.allPetitions.filter(
        petition =>
          Number(petition.creator_id) ===
          this.currentUserId
      ).length;


    this.successfulPetitionsCount =
      this.allPetitions.filter(
        petition =>
          Number(petition.creator_id) ===
          this.currentUserId &&
          petition.status === 'closed'
      ).length;


    /*
     * =======================================================
     * OFFICIAL STATISTICS
     * =======================================================
     *
     * Officials can see all petitions.
     * =======================================================
     */

    if (this.isOfficial()) {

      const allOfficialPetitions =
        this.allPetitions;


      this.localPetitionsCount =
        allOfficialPetitions.length;


      this.underReviewCount =
        allOfficialPetitions.filter(
          petition =>
            petition.status === 'under_review'
        ).length;


      this.closedPetitionsCount =
        allOfficialPetitions.filter(
          petition =>
            petition.status === 'closed'
        ).length;

    } else {

      this.localPetitionsCount = 0;

      this.underReviewCount = 0;

      this.closedPetitionsCount = 0;

    }

  }


  /*
   * =========================================================
   * LOAD SIGNATURE STATUS
   * =========================================================
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

          /*
           * =================================================
           * SUCCESS
           * =================================================
           */

          next: (res) => {

            const targetPetition =
              this.allPetitions.find(
                p =>
                  Number(p.id) ===
                  Number(petition.id)
              );


            if (!targetPetition) {

              return;

            }


            targetPetition.signed =
              Boolean(res.signed);


            targetPetition.signatureCount =
              Number(
                res.signatureCount ?? 0
              );


            this.changeDetectorRef.detectChanges();

          },


          /*
           * =================================================
           * ERROR
           * =================================================
           */

          error: (err) => {

            console.error(
              `Failed to check signature for petition ${petition.id}:`,
              err
            );


            const targetPetition =
              this.allPetitions.find(
                p =>
                  Number(p.id) ===
                  Number(petition.id)
              );


            if (!targetPetition) {

              return;

            }


            targetPetition.signed = false;

            /*
             * Keep backend count if available.
             * Do not unnecessarily destroy it.
             */

            targetPetition.signatureCount =
              Number(
                targetPetition.signatureCount ?? 0
              );


            this.changeDetectorRef.detectChanges();

          }

        });

    }

  }


  /*
   * =========================================================
   * SIGN PETITION
   * =========================================================
   */

  signPetition(
    petition: PetitionWithSignature
  ): void {

    /*
     * Only citizens can sign.
     */

    if (!this.isCitizen()) {

      return;

    }


    /*
     * Prevent duplicate requests.
     */

    if (petition.signing) {

      return;

    }


    /*
     * Already signed.
     */

    if (petition.signed) {

      return;

    }


    /*
     * Only active petitions can be signed.
     */

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

        /*
         * =================================================
         * SUCCESS
         * =================================================
         */

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


        /*
         * =================================================
         * ERROR
         * =================================================
         */

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
   * =========================================================
   * UNSIGN PETITION
   * =========================================================
   */

  unsignPetition(
    petition: PetitionWithSignature
  ): void {

    /*
     * Only citizens can unsign.
     */

    if (!this.isCitizen()) {

      return;

    }


    /*
     * Prevent duplicate requests.
     */

    if (petition.signing) {

      return;

    }


    /*
     * Nothing to remove.
     */

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

        /*
         * =================================================
         * SUCCESS
         * =================================================
         */

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


        /*
         * =================================================
         * ERROR
         * =================================================
         */

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
   * =========================================================
   * APPLY SEARCH + CATEGORY + LOCATION FILTERS
   * =========================================================
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


    const search =
      this.searchQuery
        .trim()
        .toLowerCase();


    /*
     * Filter all petitions.
     */

    this.petitions =
      this.allPetitions.filter(
        (petition) => {


          /*
           * =================================================
           * CATEGORY CONDITION
           * =================================================
           */

          const categoryMatches =
            selectedCategory ===
            'all categories' ||
            (
              petition.category &&
              petition.category
                .trim()
                .toLowerCase() ===
              selectedCategory
            );


          /*
           * =================================================
           * LOCATION CONDITION
           * =================================================
           *
           * Empty location filter means:
           * show all locations.
           * =================================================
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
           * =================================================
           * SEARCH CONDITION
           * =================================================
           *
           * Search:
           * - title
           * - description
           * - category
           * - location
           * =================================================
           */

          const searchMatches =
            !search ||
            (
              petition.title &&
              petition.title
                .toLowerCase()
                .includes(search)
            ) ||
            (
              petition.description &&
              petition.description
                .toLowerCase()
                .includes(search)
            ) ||
            (
              petition.category &&
              petition.category
                .toLowerCase()
                .includes(search)
            ) ||
            (
              petition.location &&
              petition.location
                .toLowerCase()
                .includes(search)
            );


          /*
           * =================================================
           * ALL CONDITIONS MUST MATCH
           * =================================================
           */

          return (
            categoryMatches &&
            locationMatches &&
            searchMatches
          );

        }
      );


    /*
     * Update Angular UI.
     */

    this.changeDetectorRef.detectChanges();

  }


  /*
   * =========================================================
   * SEARCH PETITIONS
   * =========================================================
   */

  searchPetitions(): void {

    this.applyFilters();

  }


  /*
   * =========================================================
   * SELECT CATEGORY
   * =========================================================
   */

  selectCategory(
    category: string
  ): void {

    this.selectedCategory =
      category;

    this.applyFilters();

  }


  /*
   * =========================================================
   * CLEAR LOCATION FILTER
   * =========================================================
   */

  clearLocationFilter(): void {

    this.locationFilter = '';

    this.applyFilters();

  }


  /*
   * =========================================================
   * CLEAR ALL FILTERS
   * =========================================================
   */

  clearFilters(): void {

    this.selectedCategory =
      'All Categories';

    this.locationFilter = '';

    this.searchQuery = '';

    this.applyFilters();

  }


  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  logout(): void {

    this.authService.logout();

    this.router.navigate([
      '/login'
    ]);

  }

}