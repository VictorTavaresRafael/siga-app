import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) return;
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (res) => {
        const token = res?.access_token ?? res?.token;
        const role = res?.role ?? this.authService.getRoleFromToken(token);

        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
          return;
        }

        if (role === 'STUDENT') {
          this.router.navigate(['/check-in']);
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'E-mail ou senha invalidos.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}

