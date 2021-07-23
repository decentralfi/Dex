import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DexComponent } from './dex.component';
import { DexRoutingModule } from './dex-routing.module';
import { SharedModule } from './shared/shared.module';
import { LoaderService } from './shared/services/loader.service';
import { MarketcapService } from './shared/services/marketcap.service';
import { MarketcapModule } from './marketcap/marketcap.module';
import { SwapModule } from './swap/swap.module';
import { DecimalPipe } from '@angular/common';
import { RoundedValuePipe } from './shared/pipes/rounded-value.pipe';

@NgModule({
  imports: [
    CommonModule,
    DexRoutingModule,
    SharedModule,
    MarketcapModule,
    SwapModule,
  ],
  providers: [
    LoaderService,
    MarketcapService,
    DecimalPipe,
    RoundedValuePipe
  ],
  declarations: [DexComponent],
})
export class DexModule { }
