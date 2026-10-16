import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';


const API_BASE_URL =
  'http://localhost:5000/api';


export interface CreatePetitionRequest {

  title: string;

  description: string;

  category: string;

  location: string;

  signatureLimit: number;

}


export interface Petition {

  id: number;

  creator_id: number;

  title: string;

  description: string;

  category: string;

  location: string;

  status:
    | 'active'
    | 'under_review'
    | 'closed';

  signatureLimit: number;

  signatureCount?: number;

}


@Injectable({
  providedIn: 'root'
})
export class PetitionService {

  private http = inject(HttpClient);


  private apiUrl =
    `${API_BASE_URL}/petitions`;


  // =====================================================
  // CREATE PETITION
  // =====================================================

  createPetition(
    petition: CreatePetitionRequest
  ): Observable<{
    message: string;
    petition: Petition;
  }> {

    console.log(
      'Sending petition:',
      petition
    );

    return this.http.post<{
      message: string;
      petition: Petition;
    }>(
      this.apiUrl,
      petition
    );

  }


  // =====================================================
  // GET PETITIONS
  // =====================================================

  getPetitions(
    location?: string,
    category?: string,
    status?: string
  ): Observable<Petition[]> {

    let params =
      new HttpParams();


    if (location) {

      params =
        params.set(
          'location',
          location
        );

    }


    if (category) {

      params =
        params.set(
          'category',
          category
        );

    }


    if (status) {

      params =
        params.set(
          'status',
          status
        );

    }


    return this.http.get<Petition[]>(
      this.apiUrl,
      {
        params
      }
    );

  }


  // =====================================================
  // GET SINGLE PETITION
  // =====================================================

  getPetition(
    id: number
  ): Observable<Petition> {

    return this.http.get<Petition>(
      `${this.apiUrl}/${id}`
    );

  }


  // =====================================================
  // UPDATE PETITION
  // =====================================================

  updatePetition(
    id: number,
    petition: Partial<CreatePetitionRequest>
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}`,
      petition
    );

  }


  // =====================================================
  // SIGN PETITION
  // =====================================================

  signPetition(
    id: number
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/${id}/sign`,
      {}
    );

  }


  // =====================================================
  // REMOVE SIGNATURE
  // =====================================================

  unsignPetition(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}/sign`
    );

  }


  // =====================================================
  // CHECK SIGNATURE
  // =====================================================

  checkSignature(
    id: number
  ): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/${id}/sign`
    );

  }


  // =====================================================
  // DELETE PETITION
  // =====================================================

  deletePetition(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );

  }

}