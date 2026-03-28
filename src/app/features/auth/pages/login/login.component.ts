import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { LoginRequest } from '../../../../core/auth/models';

/**
 * Login page component with Material form
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Loading state signal
  isLoading = signal(false);

  // Login form
  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * Submit login form
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const loginRequest: LoginRequest = this.loginForm.value;

    this.authService.login(loginRequest).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Connexion réussie !', 'Fermer', { duration: 3000 });
        this.router.navigate(['/lobby']);
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = error.error?.message || 'Échec de la connexion. Vérifiez vos identifiants.';
        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
      }
    });
  }

  /**
   * Get form field error message
   */
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    return '';
  }
}
