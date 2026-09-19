import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },

    {
        path: 'register',
        component: RegisterComponent
    },

    {
        path: 'dashboard',
        loadComponent: () =>
            import('./dashboard/dashboard').then(m => m.Dashboard)
    },

    {
        path: 'polls',
        loadComponent: () =>
            import('./polls/poll-board/poll-board')
                .then(m => m.PollBoard)
    },

    {
        path: 'polls/create',
        loadComponent: () =>
            import('./polls/create-poll/create-poll')
                .then(m => m.CreatePoll)
    },

    {
        path: 'polls/:id',
        loadComponent: () =>
            import('./polls/poll-detail/poll-detail')
                .then(m => m.PollDetail)
    },

    {
        path: 'petitions/create',
        loadComponent: () =>
            import('./petitions/create-petition/create-petition')
                .then(m => m.CreatePetition)
    },

    {
        path: 'petitions/edit/:id',
        loadComponent: () =>
            import('./petitions/edit-petition/edit-petition')
                .then(m => m.EditPetition)
    },

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];