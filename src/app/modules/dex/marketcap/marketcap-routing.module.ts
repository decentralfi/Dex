import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MarketcapComponent } from './marketcap.component';

// Routes
const routes: Routes = [

  { path: '', component: MarketcapComponent }

];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarketcapRoutingModule { }
