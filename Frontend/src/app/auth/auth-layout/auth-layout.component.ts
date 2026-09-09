import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent {
  features = [
    {
      icon: 'petition',
      title: 'Create and Sign Petitions',
      description: 'Easily create petitions for issues you care about and gather support from your community.'
    },
    {
      icon: 'poll',
      title: 'Participate in Public Polls',
      description: 'Vote on local issues and see real-time results of community sentiment.'
    },
    {
      icon: 'track',
      title: 'Track Official Responses',
      description: 'See how local officials respond to community concerns and track progress on issues.'
    }
  ];
}
