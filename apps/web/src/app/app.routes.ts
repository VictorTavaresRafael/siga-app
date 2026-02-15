import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { presenceGuard } from './core/guards/presence.guard';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  // Redireciona a raiz para o login automaticamente
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Rota de Login (Pública)
  { 
    path: 'login', 
    component: LoginComponent
  },
  
  // Rota do Dashboard (Protegida)
  { 
    path: 'dashboard', 
    canActivate: [authGuard, presenceGuard], // Aplica o Guard de segurança
    loadComponent: () => import('./features/dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
  },

  // Rota de Check-in (Protegida)
  {
    path: 'check-in',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/check-in/check-in.component').then(m => m.CheckInComponent)
  },

  // Rota Admin (Protegida)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },

  { path: '**', redirectTo: 'login' }
];
