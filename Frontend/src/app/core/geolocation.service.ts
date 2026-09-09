import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface LocationResponse {
  location: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  private apiUrl = 'http://localhost:5000/api/location';

  constructor(private http: HttpClient) {}

  /**
   * Get the user's current GPS coordinates.
   */
  getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {

      if (!navigator.geolocation) {
        reject(
          new Error(
            'Geolocation is not supported by this browser.'
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {

          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

        },

        (error) => {
          reject(error);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  /**
   * Convert latitude and longitude
   * into a readable location name.
   */
  getLocationName(
    latitude: number,
    longitude: number
  ): Observable<LocationResponse> {

    return this.http.post<LocationResponse>(
      `${this.apiUrl}/reverse-geocode`,
      {
        latitude,
        longitude
      }
    );
  }
}