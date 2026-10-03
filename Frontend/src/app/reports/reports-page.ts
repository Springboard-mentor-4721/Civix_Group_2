import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

const API_BASE_URL = 'http://localhost:5000/api';

@Component({
    selector: 'app-reports-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './reports-page.html',
    styleUrl: './reports-page.scss'
})
export class ReportsPage implements OnInit {
    selectedMonth = '';
    report: any = null;
    loading = false;
    exporting = false;
    error = '';

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
            this.exporting = false;
            this.changeDetector.markForCheck();
            this.router.navigate(['/dashboard']);
            return;
        }

        const now = new Date();
        this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        this.loadReport();
    }

    private getPeriod(): { month: number; year: number } | null {
        const match = /^(\d{4})-(\d{2})$/.exec(this.selectedMonth);
        if (!match) return null;
        return { year: Number(match[1]), month: Number(match[2]) };
    }

    loadReport(): void {
        const period = this.getPeriod();
        if (!period) {
            this.error = 'Choose a valid report month.';
            return;
        }

        this.loading = true;
        this.error = '';
        this.http.get<{ report: any }>(`${API_BASE_URL}/reports/monthly`, {
            params: { month: period.month, year: period.year }
        }).subscribe({
            next: (response) => {
                this.report = response.report;
                this.loading = false;
                this.changeDetector.markForCheck();
            },
            error: (error) => {
                this.error = error?.error?.message || 'Could not generate this monthly report.';
                this.loading = false;
                this.changeDetector.markForCheck();
            }
        });
    }

    exportCsv(): void {
        const period = this.getPeriod();
        if (!period || this.exporting) return;

        this.exporting = true;
        this.error = '';
        this.http.get(`${API_BASE_URL}/reports/monthly/export`, {
            params: { month: period.month, year: period.year },
            responseType: 'blob'
        }).subscribe({
            next: (file) => {
                const url = URL.createObjectURL(file);
                const link = document.createElement('a');
                link.href = url;
                link.download = `civix-report-${period.year}-${String(period.month).padStart(2, '0')}.csv`;
                link.click();
                URL.revokeObjectURL(url);
                this.exporting = false;
                this.changeDetector.markForCheck();
            },
            error: (error) => {
                this.error = error?.error?.message || 'Could not export the report.';
                this.exporting = false;
                this.changeDetector.markForCheck();
            }
        });
    }

    entries(value: Record<string, number> | null | undefined): Array<{ name: string; count: number }> {
        return Object.entries(value || {}).map(([name, count]) => ({ name, count }));
    }
}
