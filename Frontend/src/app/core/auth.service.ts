import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API_BASE_URL = 'http://localhost:5000/api';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    location?: string;
}

export interface LoginResponse {
    message: string;
    token: string;
    user: AuthUser;
}

export interface RegisterResponse {
    message: string;
    user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password })
            .pipe(tap((res) => this.storeSession(res)));
    }

    register(payload: {
        name: string;
        email: string;
        password: string;
        location: string;
        role: string;
    }): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, payload);
    }

    private storeSession(res: LoginResponse): void {
        localStorage.setItem('civix_token', res.token);
        localStorage.setItem('civix_user', JSON.stringify(res.user));
    }

    logout(): void {
        localStorage.removeItem('civix_token');
        localStorage.removeItem('civix_user');
    }

    get token(): string | null {
        return localStorage.getItem('civix_token');
    }
}