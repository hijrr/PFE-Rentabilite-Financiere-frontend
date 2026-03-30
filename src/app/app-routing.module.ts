import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DasboardComponent } from './modules/dasboard/dasboard.component';
import { GestionSalariesComponent } from './modules/gestion-salaries/gestion-salaries.component';
import { CalculRenMainComponent } from './modules/calcul-ren-main/calcul-ren-main.component';
import { GestionClientComponent } from './modules/gestion-client/gestion-client.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth.guard';
import { GestionFacturationComponent } from './modules/gestion-facturation/gestion-facturation.component';
import { GestionProjetComponent } from './modules/gestion-projet/gestion-projet.component';
import { PageMainComponent } from './modules/page-main/page-main.component';
import { HistoriqueSalarieComponent } from './modules/historique-salarie/historique-salarie.component';

const routes: Routes = [
  { path:'login', component:AuthComponent },
  {path:'Calcul',component:CalculRenMainComponent,canActivate: [AuthGuard]},
  {path:'Facturation',component:GestionFacturationComponent,canActivate: [AuthGuard]},
  {path:'Salaries',component:GestionSalariesComponent,canActivate: [AuthGuard]},
  {path:'Accueil',component:PageMainComponent,canActivate: [AuthGuard]},
  {path:'Clients',component:GestionClientComponent,canActivate: [AuthGuard]},
  {path:'Projets',component: GestionProjetComponent,canActivate: [AuthGuard]},
  {path:'Historique',component: HistoriqueSalarieComponent,canActivate: [AuthGuard]},
  { path: '**', redirectTo: localStorage.getItem('token') ? 'Accueil' : 'login'  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
