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
@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    DolibarrSyncComponentComponent,
    FinanceImportComponentComponent,
    FinancialDataFormComponentComponent,
    DasboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [ { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
