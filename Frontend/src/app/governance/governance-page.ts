import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

const API_BASE_URL = 'http://localhost:5000/api';

type PetitionStatus = 'active' | 'under_review' | 'closed';

interface GovernanceResponse {
    id: number;
    official_id: number;
    comment: string;
    status: PetitionStatus;
    createdAt: string;
}

interface LocalPetition {
    id: number;
    title: string;
    description: string;
    category: string;
    location: string;
    status: PetitionStatus;
    signatureCount: number;
    signatureLimit: number;
    latestResponse: GovernanceResponse | null;
}

@Component({
    selector: 'app-governance-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './governance-page.html',
    styleUrl: './governance-page.scss'
})
export class GovernancePage implements OnInit {
    petitions: LocalPetition[] = [];
    loading = false;
    submitting = false;
    error = '';
    notice = '';
    activePetitionId: number | null = null;
    responses: GovernanceResponse[] = [];
    responseLoading = false;
    comment = '';
    responseStatus: PetitionStatus = 'active';

    constructor(
        private http: HttpClient,
        private changeDetector: ChangeDetectorRef,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        if (!this.authService.isOfficial()) {
            this.error = 'Official access required.';
            this.loading = false;
            this.changeDetector.markForCheck();
            this.router.navigate(['/dashboard']);
            return;
        }
        this.loadPetitions();
    }

    loadPetitions(): void {
        this.loading = true;
        this.error = '';
        this.http.get<{ location: string; count: number; petitions: LocalPetition[] }>(
            `${API_BASE_URL}/governance/petitions`
        ).subscribe({
            next: (response) => {
                this.petitions = response.petitions || [];
                this.loading = false;
                this.changeDetector.markForCheck();
            },
            error: (error) => {
                this.error = error?.error?.message || 'Could not load local petitions.';
                this.loading = false;
                this.changeDetector.markForCheck();
            }
        });
    }

    openResponsePanel(petition: LocalPetition): void {
        this.activePetitionId = petition.id;
        this.comment = '';
        this.responseStatus = petition.status;
        this.responses = [];
        this.error = '';
        this.responseLoading = true;
        this.http.get<{ petition: LocalPetition; responses: GovernanceResponse[] }>(
            `${API_BASE_URL}/governance/petitions/${petition.id}`
        ).subscribe({
            next: (response) => {
                this.responseStatus = response.petition.status;
                this.responses = response.responses || [];
                this.responseLoading = false;
                this.changeDetector.markForCheck();
            },
            error: (error) => {
                this.error = error?.error?.message || 'Could not load response history.';
                this.responseLoading = false;
                this.changeDetector.markForCheck();
            }
        });
    }

    closeResponsePanel(): void {
        this.activePetitionId = null;
        this.responses = [];
        this.comment = '';
        this.error = '';
    }

    submitResponse(petition: LocalPetition): void {
        const comment = this.comment.trim();
        if (!comment) {
            this.error = 'Add a public comment before submitting the status update.';
            return;
        }
        if (this.submitting) return;

        this.submitting = true;
        this.error = '';
        this.notice = '';
        this.http.post<{ message: string; petition: { id: number; status: PetitionStatus }; response: GovernanceResponse }>(
            `${API_BASE_URL}/governance/petitions/${petition.id}/respond`,
            { comment, status: this.responseStatus }
        ).subscribe({
            next: (result) => {
                petition.status = result.petition.status;
                petition.latestResponse = result.response;
                this.responses = [result.response, ...this.responses];
                this.comment = '';
                this.submitting = false;
                this.notice = 'Response and status update published.';
                this.changeDetector.markForCheck();
            },
            error: (error) => {
                this.submitting = false;
                this.error = error?.error?.message || 'Could not publish the response.';
                this.changeDetector.markForCheck();
            }
        });
    }
}
