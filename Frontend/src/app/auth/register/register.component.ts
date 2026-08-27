import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  submitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      location: ['', Validators.required],
      role: ['citizen', Validators.required]
    });
  }

  get name() {
    return this.form.get('name');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get location() {
    return this.form.get('location');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    // Step A: create the account
    this.authService.register(this.form.value).subscribe({
      next: () => {
        // Step B: backend doesn't return a token on register,
        // so log in right after to get one and land on the dashboard.
        this.authService.login(email, password).subscribe({
          next: () => {
            this.submitting = false;
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.submitting = false;
            this.errorMessage = err?.error?.message || 'Registered, but auto-login failed. Please log in.';
          }
        });
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}