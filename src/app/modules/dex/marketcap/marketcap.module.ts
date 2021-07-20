import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketcapComponent } from './marketcap.component';
import { MarketcapRoutingModule } from './marketcap-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DecimalPipe } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';


@NgModule({
  imports: [
    CommonModule,
    MarketcapRoutingModule,
    SharedModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [
    DecimalPipe
  ],
  declarations: [MarketcapComponent]
})
export class MarketcapModule { }
