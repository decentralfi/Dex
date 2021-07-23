import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwapComponent } from './swap.component';
import { SwapRoutingModule } from './swap-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DecimalPipe } from '@angular/common';
import { MidgardService } from '../shared/services/midgard.service';

@NgModule({
  imports: [
    CommonModule,
    SwapRoutingModule,
    SharedModule
  ],
  providers: [
    DecimalPipe,
    MidgardService
  ],
  declarations: [SwapComponent]
})
export class SwapModule { }