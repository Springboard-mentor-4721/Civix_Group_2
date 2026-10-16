import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { AuthService } from '../../core/auth.service';
import {
  GeolocationService,
  LocationData
} from '../../core/geolocation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  form: FormGroup;

  submitting = false;

  // Location states
  detectingLocation = false;
  locationDetected = false;

  errorMessage = '';
  locationMessage = '';

  // GPS coordinates
  latitude: number | null = null;
  longitude: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private geolocationService: GeolocationService
  ) {

    this.form = this.fb.group({

      name: [
        '',
        Validators.required
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      // Location is optional
      location: [
        ''
      ],

      role: [
        'citizen',
        Validators.required
      ]

    });
  }


  // -----------------------------
  // Form getters
  // -----------------------------

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


  // -----------------------------
  // Location Detection
  // -----------------------------

  detectLocation(): void {

    // Prevent multiple clicks
    if (this.detectingLocation) {
      return;
    }

    this.detectingLocation = true;
    this.locationDetected = false;
    this.locationMessage = 'Detecting your location...';


    // Step 1:
    // Get GPS coordinates from browser
    this.geolocationService
      .getCurrentLocation()

      .then((location: LocationData) => {

        this.latitude = location.latitude;
        this.longitude = location.longitude;


        // Step 2:
        // Send coordinates to backend
        // for reverse geocoding
        this.geolocationService
          .getLocationName(
            this.latitude,
            this.longitude
          )

          .subscribe({

            // -----------------------------
            // Success
            // -----------------------------

            next: (response) => {

              // Display readable location
              this.form.patchValue({
                location: response.location
              });

              // Show green tick
              this.locationDetected = true;

              // Stop loading state
              this.detectingLocation = false;

              // Remove detecting message
              this.locationMessage = '';
            },


            // -----------------------------
            // Backend location error
            // -----------------------------

            error: (error) => {

              console.error(
                'Reverse geocoding failed:',
                error
              );

              this.locationDetected = false;
              this.detectingLocation = false;

              this.locationMessage =
                'Could not determine your location. You can continue without location.';
            }

          });

      })


      // -----------------------------
      // Browser location error
      // -----------------------------

      .catch((error) => {

        console.error(
          'Location detection failed:',
          error
        );

        this.latitude = null;
        this.longitude = null;

        this.locationDetected = false;
        this.detectingLocation = false;

        this.locationMessage =
          'Location permission was not granted. You can continue without location.';
      });
  }


  // -----------------------------
  // Registration
  // -----------------------------

  onSubmit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.submitting = true;
    this.errorMessage = '';


    const {
      email,
      password
    } = this.form.value;


    // Create registration data
    const registrationData: any = {
      ...this.form.value
    };


    // Add GPS coordinates if detected
    if (
      this.latitude !== null &&
      this.longitude !== null
    ) {

      registrationData.latitude =
        this.latitude;

      registrationData.longitude =
        this.longitude;
    }


    // Register user
    this.authService
      .register(registrationData)

      .subscribe({

        // -----------------------------
        // Registration successful
        // -----------------------------

        next: () => {

          /*
           * Login automatically after
           * successful registration.
           */

          this.authService
            .login(
              email,
              password
            )

            .subscribe({

              next: () => {

                this.submitting = false;

                this.router.navigate([
                  '/dashboard'
                ]);
              },

              error: (err) => {

                this.submitting = false;

                this.errorMessage =
                  err?.error?.message ||
                  'Registered, but auto-login failed. Please log in.';
              }

            });
        },


        // -----------------------------
        // Registration error
        // -----------------------------

        error: (err) => {

          this.submitting = false;

          this.errorMessage =
            err?.error?.message ||
            'Registration failed. Please try again.';
        }

      });
  }

}