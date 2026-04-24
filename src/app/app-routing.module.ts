import { GestionParPeriodeComponent } from './modules/gestion-par-periode/gestion-par-periode.component';
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
import { ParametresComponent } from './modules/parametres/parametres.component';
import { GestionParSalariesComponent } from './modules/gestion-par-salaries/gestion-par-salaries.component';
import { ChatbotComponent } from './modules/chatbot/chatbot.component';
import { PredictionIAComponent } from './modules/prediction-ia/prediction-ia.component';

const routes: Routes = [
  { path:'login', component:AuthComponent },
  {path:'Calcul',component:CalculRenMainComponent,canActivate: [AuthGuard]},
  {path:'Facturation',component:GestionFacturationComponent,canActivate: [AuthGuard]},
  {path:'Salaries',component:GestionSalariesComponent,canActivate: [AuthGuard]},
  {path:'Accueil',component:PageMainComponent,canActivate: [AuthGuard]},
  {path:'Clients',component:GestionClientComponent,canActivate: [AuthGuard]},
  {path:'Projets',component: GestionProjetComponent,canActivate: [AuthGuard]},
  {path:'Historique',component: HistoriqueSalarieComponent,canActivate: [AuthGuard]},
  {path:'Parametres',component: ParametresComponent,canActivate: [AuthGuard]},
  {path:'CalculParSalaire',component: GestionParPeriodeComponent,canActivate: [AuthGuard]},
  {path:'CalculParGroupe',component: GestionParSalariesComponent,canActivate: [AuthGuard]},
  {path:'Chatbot',component: ChatbotComponent,canActivate: [AuthGuard]},
  {path:'prediction',component: PredictionIAComponent,canActivate: [AuthGuard]},
  { path: '**', redirectTo: localStorage.getItem('token') ? 'Accueil' : 'login'  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
