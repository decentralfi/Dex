import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout-component/layout.component';
import { ErrorComponent } from './shared/error/error.component';

// Routes
const routes: Routes = [

  {
  path: '',
  component: LayoutComponent,
  children: [
      {
        path: '',
        redirectTo: 'poolrates',
        pathMatch: 'full'
      },
      {
        path: 'poolrates',
        loadChildren: () => import('./poolrates/poolrates.module').then(m => m.PoolratesModule),
      },
      {
        path: 'volumes',
        loadChildren: () => import('./volumes/volumes.module').then(m => m.VolumesModule),
      },
      {
        path: 'network',
        loadChildren: () => import('./network/network.module').then(m => m.NetworkModule),
      },
    ]
  },
  {
        path: '**',
        redirectTo: '404'
  },
  { 
    path: '404', 
    component: ErrorComponent 
  },

];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DecentralAppRoutingModule { }
