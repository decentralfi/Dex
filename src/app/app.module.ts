import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/* Master Wallet Manager */
import { MasterWalletManagerService } from './services/master-wallet-manager.service';

import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';

import { DecimalPipe } from '@angular/common';
import { RoundedValuePipe } from 'src/app/modules/dex/shared/pipes/rounded-value.pipe';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    HttpClientModule,
    NoopAnimationsModule,
    FontAwesomeModule
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'en-US' },
    MasterWalletManagerService,
    GlobalChartsThemeService,
    DecimalPipe,
    RoundedValuePipe
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
