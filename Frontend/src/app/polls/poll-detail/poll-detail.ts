import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface PollResultResponse {
    poll: {
        id: number;
        title: string;
        target_location: string;
        options: string[];
    };
    results: {
        totalVotes: number;
        results: { option: string; votes: number; percentage: number }[];
        userVoted: boolean;
        selectedOption: string | null;
    };
}

@Component({
    selector: 'app-poll-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './poll-detail.html',
    styleUrl: './poll-detail.scss'
})
export class PollDetail implements OnInit {
    pollId: number | null = null;
    poll: any = null;
    results: any = null;
    loading = false;
    error = '';
    selectedOption = '';
    voting = false;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.pollId = Number(this.route.snapshot.paramMap.get('id'));
        this.load();
    }

    load(): void {
        if (!this.pollId) return;
        this.loading = true;
        this.http.get<PollResultResponse>(`http://localhost:5000/api/polls/${this.pollId}`).subscribe({
            next: (res) => {
                this.poll = res.poll;
                this.results = res.results;
                this.selectedOption = res.results?.selectedOption || '';
                this.loading = false;
                this.changeDetector.markForCheck();
            },
            error: () => {
                this.error = 'Unable to load poll details.';
                this.loading = false;
                this.changeDetector.markForCheck();
            }
        });
    }

    vote(): void {
        if (!this.pollId || !this.selectedOption) return;
        this.voting = true;
        this.error = '';

        this.http.post(`http://localhost:5000/api/polls/${this.pollId}/vote`, {
            selected_option: this.selectedOption
        }).subscribe({
            next: (res: any) => {
                this.results = res.results;
                this.selectedOption = res.results.selectedOption || this.selectedOption;
                this.voting = false;
                this.changeDetector.markForCheck();
            },
            error: (err) => {
                this.voting = false;
                this.error = err?.error?.message || 'Vote failed.';
                this.changeDetector.markForCheck();
            }
        });
    }
}
