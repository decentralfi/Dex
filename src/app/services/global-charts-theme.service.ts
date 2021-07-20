/* This service is used to set the global theme for charts */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { settings } from '../../settings/settings';

@Injectable()
export class GlobalChartsThemeService {

  private globalTheme = new BehaviorSubject(localStorage.getItem('dcf-theme'));
  private toggleSidebar = new BehaviorSubject(false);

constructor() { }

setGlobalChartTheme(theme){
  this.globalTheme.next(theme);
}

getGlobalChartTheme(){
  return this.globalTheme.asObservable();
}

setToggleSidebar(){
  this.toggleSidebar.next(true);
}

getToggleSidebar(){
  return this.toggleSidebar.asObservable();
}

}
