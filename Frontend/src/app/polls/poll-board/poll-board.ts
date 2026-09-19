import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PollSummary {
    id: number;
    title: string;
    options: string[];
    target_location: string;
    created_by: number;
    totalVotes: number;
    userVoted: boolean;
}

@Component({
    selector: 'app-poll-board',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './poll-board.html',
    styleUrl: './poll-board.scss'
})
export class PollBoard implements OnInit {
    polls: PollSummary[] = [];
    search = '';
    loading = false;
    error = '';

    constructor(
        private http: HttpClient,
        private router: Router,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadPolls();
    }

    loadPolls(): void {
        this.loading = true;
        this.error = '';

        this.http.get<PollSummary[]>('http://localhost:5000/api/polls').subscribe({
            next: (polls) => {
                this.polls = Array.isArray(polls) ? polls : [];
                this.loading = false;
                this.changeDetector.markForCheck();
            },
            error: () => {
                this.loading = false;
                this.error = 'Unable to load polls right now.';
                this.changeDetector.markForCheck();
            }
        });
    }

    filteredPolls(): PollSummary[] {
        const q = this.search.trim().toLowerCase();
        if (!q) return this.polls;

        return this.polls.filter((poll) =>
            poll.title.toLowerCase().includes(q) ||
            poll.target_location.toLowerCase().includes(q) ||
            poll.options.some((option) => option.toLowerCase().includes(q))
        );
    }

    goCreate(): void {
        this.router.navigate(['/polls/create']);
    }

    goDashboard(): void {
        this.router.navigate(['/dashboard']);
    }

    openPoll(id: number): void {
        this.router.navigate(['/polls', id]);
    }
}
