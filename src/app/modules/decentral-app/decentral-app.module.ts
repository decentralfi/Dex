import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecentralAppRoutingModule } from './decentral-app-routing.module';
import { LayoutComponent } from './layout-component/layout.component';
import { SharedModule } from './shared/shared.module';
import { VolumesModule } from './volumes/volumes.module';
import { PoolratesModule } from './poolrates/poolrates.module';
/* Global Currency Service */
import { CurrencyService } from './shared/services/currency.service';
/* Global Time Period Service */
import { GlobalTimePeriodService } from './shared/services/global-time-period.service';
/* Global Time Period Service */
import { GlobalCurrencyService } from './shared/services/global-currency.service';
/* Loader Spinner Service */
import { LoaderService } from './shared/services/loader.service';

@NgModule({
  imports: [
    CommonModule,
    DecentralAppRoutingModule,
    SharedModule,
    VolumesModule,
    PoolratesModule,
  ],
  providers: [
    CurrencyService,
    GlobalCurrencyService,
    GlobalTimePeriodService,
    LoaderService
  ],
  declarations: [	
    LayoutComponent
   ]
})
export class DecentralAppModule { }
