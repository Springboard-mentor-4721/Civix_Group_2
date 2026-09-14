import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:5000/api';

export interface CreatePetitionPayload {
    title: string;
    description: string;
    category: string;
    location: string;
    signatureLimit: number;
}

@Injectable({ providedIn: 'root' })
export class PetitionService {
    constructor(private http: HttpClient) { }

    createPetition(payload: CreatePetitionPayload): Observable<any> {
        return this.http.post(`${API_BASE_URL}/petitions`, payload);
    }
}