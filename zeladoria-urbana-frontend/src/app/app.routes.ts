import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro').then(m => m.CadastroComponent)
  },
  {
    path: 'novo-relato',
    loadComponent: () => import('./pages/novo-relato/novo-relato').then(m => m.NovoRelatoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'lista-ocorrencias',
    loadComponent: () => import('./pages/lista-ocorrencias/lista-ocorrencias').then(m => m.ListaOcorrenciasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'meu-perfil',
    loadComponent: () => import('./pages/meu-perfil/meu-perfil').then(m => m.MeuPerfilComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./pages/configuracoes/configuracoes').then(m => m.ConfiguracoesComponent),
    canActivate: [authGuard] 
  },

  { path: '**', redirectTo: 'dashboard' }
];