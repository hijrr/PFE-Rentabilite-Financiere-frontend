import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DasboardComponent } from './modules/dasboard/dasboard.component';
import { GestionSalariesComponent } from './modules/gestion-salaries/gestion-salaries.component';
import { CalculRenMainComponent } from './modules/calcul-ren-main/calcul-ren-main.component';
import { GestionClientComponent } from './modules/gestion-client/gestion-client.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path:'login', component:AuthComponent },
  {path:'',component:CalculRenMainComponent,canActivate: [AuthGuard]},
  {path:'Salaries',component:GestionSalariesComponent,canActivate: [AuthGuard]},
  {path:'Clients',component:GestionClientComponent,canActivate: [AuthGuard]},
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
