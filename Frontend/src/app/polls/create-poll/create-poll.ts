import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-create-poll',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './create-poll.html',
    styleUrl: './create-poll.scss'
})
export class CreatePoll {
    title = '';
    targetLocation = '';
    options = ['', ''];
    loading = false;
    error = '';

    constructor(private http: HttpClient, public router: Router) { }

    goBack(): void {
        this.router.navigate(['/polls']);
    }

    addOption(): void {
        if (this.options.length < 10) {
            this.options.push('');
        }
    }

    trackByIndex(index: number): number {
        return index;
    }

    removeOption(index: number): void {
        if (this.options.length > 2) {
            this.options.splice(index, 1);
        }
    }

    submit(): void {
        const trimmedTitle = this.title.trim();
        const trimmedLocation = this.targetLocation.trim();
        const cleaned = this.options.map((o) => o.trim()).filter(Boolean);

        if (!trimmedTitle) {
            this.error = 'Please enter a poll title.';
            return;
        }

        if (!trimmedLocation) {
            this.error = 'Please enter a target location.';
            return;
        }

        if (cleaned.length < 2) {
            this.error = 'Please add at least two valid poll options.';
            return;
        }

        this.loading = true;
        this.error = '';

        this.http.post('http://localhost:5000/api/polls', {
            title: trimmedTitle,
            target_location: trimmedLocation,
            options: cleaned
        }).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/polls']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.message || 'Failed to create poll.';
            }
        });
    }
}
