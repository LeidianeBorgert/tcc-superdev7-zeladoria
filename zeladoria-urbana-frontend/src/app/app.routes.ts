import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { NovoRelatoComponent } from './pages/novo-relato/novo-relato';
import { ListaOcorrenciasComponent } from './pages/lista-ocorrencias/lista-ocorrencias';
import { CadastroComponent } from './pages/cadastro/cadastro';
import { LoginComponent } from './pages/login/login';


export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'novo-relato',
    loadComponent: () => import('./pages/novo-relato/novo-relato').then(m => m.NovoRelatoComponent)
  },
  {
    path: 'lista-ocorrencias',
    loadComponent: () => import('./pages/lista-ocorrencias/lista-ocorrencias').then(m => m.ListaOcorrenciasComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro').then(m => m.CadastroComponent)
  }
];