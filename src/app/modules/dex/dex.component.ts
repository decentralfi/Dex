import { Component, OnInit, HostBinding } from '@angular/core';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';

@Component({
  selector: 'app-dex',
  templateUrl: './dex.component.html',
  styleUrls: ['./dex.component.scss']
})
export class DexComponent implements OnInit {

  @HostBinding('class') componentCssClass: any;

  public themeValue = '';

  constructor(
    private chartThemeService: GlobalChartsThemeService,
  ) { }

  ngOnInit() {

    this.chartThemeService.getGlobalChartTheme().subscribe(theme =>{
      this.componentCssClass = theme;
    });

  }

}
