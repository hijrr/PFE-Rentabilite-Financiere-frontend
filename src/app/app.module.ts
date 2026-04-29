import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { DolibarrSyncComponentComponent } from './modules/dolibarr-sync-component/dolibarr-sync-component.component';
import { FinanceImportComponentComponent } from './modules/finance-import-component/finance-import-component.component';
import { FinancialDataFormComponentComponent } from './modules/financial-data-form-component/financial-data-form-component.component';
import { DasboardComponent } from './modules/dasboard/dasboard.component';
import { CalculRenMainComponent } from './modules/calcul-ren-main/calcul-ren-main.component';
import { GestionSalariesComponent } from './modules/gestion-salaries/gestion-salaries.component';
import { GestionClientComponent } from './modules/gestion-client/gestion-client.component';
import { GestionFacturationComponent } from './modules/gestion-facturation/gestion-facturation.component';
import { GestionProjetComponent } from './modules/gestion-projet/gestion-projet.component';
import { HeaderComponent } from './modules/header/header.component';
import { PageMainComponent } from './modules/page-main/page-main.component';
import { HistoriqueSalarieComponent } from './modules/historique-salarie/historique-salarie.component';
import { ParametresComponent } from './modules/parametres/parametres.component';
import { GestionParPeriodeComponent } from './modules/gestion-par-periode/gestion-par-periode.component';
import { GestionParSalariesComponent } from './modules/gestion-par-salaries/gestion-par-salaries.component';
import { NgChartsModule } from 'ng2-charts';
import { ChatbotComponent } from './modules/chatbot/chatbot.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { PredictionIAComponent } from './modules/prediction-ia/prediction-ia.component';
import { NotificationComponent } from './modules/notification/notification.component';
import { NotificationBellComponent } from './modules/notification-bell/notification-bell.component';
@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    DolibarrSyncComponentComponent,
    FinanceImportComponentComponent,
    FinancialDataFormComponentComponent,
    DasboardComponent,
    CalculRenMainComponent,
    GestionSalariesComponent,
    GestionClientComponent,
    GestionFacturationComponent,
    GestionProjetComponent,
    HeaderComponent,
    PageMainComponent,
    HistoriqueSalarieComponent,
    ParametresComponent,
    GestionParPeriodeComponent,
    GestionParSalariesComponent,
    ChatbotComponent,
    PredictionIAComponent,
    NotificationComponent,
    NotificationBellComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgChartsModule,
    NgSelectModule
  ],
  providers: [ { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
