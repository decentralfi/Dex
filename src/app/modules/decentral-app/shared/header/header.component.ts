import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import { CurrencyService } from '../../shared/services/currency.service';
import { GlobalTimePeriodService } from '../../shared/services/global-time-period.service';
import { GlobalCurrencyService } from '../../shared/services/global-currency.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { NetworkChainService } from '../../shared/services/network-chain.service';

@Component({
  selector: 'dcf-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Output() toggle = new EventEmitter<string>();
  @Output() theme = new EventEmitter<string>();

  constructor(
    private currenciesService: CurrencyService,
    private timePeriodService: GlobalTimePeriodService,
    private currencyService: GlobalCurrencyService,
    private chartThemeService: GlobalChartsThemeService,
    private networkChainService: NetworkChainService,
    private router: Router,
    private _snackBar: MatSnackBar,
    ) { 
      this.today.setDate(this.today.getDate());      
    }

  defaultCurrency = new FormControl('RUNE');
  
  public currencies = [];
  public currencyName:string = 'RUNE';
  public currencyValue:string = 'RUNE';
  public perdiodRangeValue:string = '24H';
  public perdiodRangeLabel:string;
  public perdiodButtonClass:string = 'period-button';
  public startDate: string = '';
  public endDate: string = '';
  public today = new Date();
  public themeValue = '';
  public isToggle: boolean;
  public networkToggle: boolean = true;

  public periods = [
    { label:'24H', value: 'last24hr' },
    { label:'7D', value: 'last7day' },
    { label:'1M', value: 'lastMonth' },
    { label:'3M', value: 'last3Month' },
    { label:'6M', value: 'last6Month' },
  ];

  public networkLabel:string = 'MCCN';
  public networkValue:string = 'multichain_chaosnet';

  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public selectedWallet: string;
  public selectedWalletLabel: string;

  ngOnInit() {

    this.currenciesService.getCurrencies(this.networkValue).subscribe((data: Array<any>) => {
      for (let i = 0; i < data.length; i++) {
        
        let findDot = data[i].name.indexOf('.');
        let findDash = data[i].name.indexOf('-');
        let label = findDash == -1 ? data[i].name.substr(findDot + 1) : data[i].name.substr(findDot + 1,findDash - 4);

        let id = data[i].id;
        let price = data[i].price_rune;
        let element = {label,id,price};

        this.currencies.push(element);
        
      }
    });

    this.themeValue = localStorage.getItem('dcf-theme');
    if(this.themeValue == '' || this.themeValue == 'light-theme'){
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.isToggle = false;
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }else{
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.isToggle = true;
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    /* Here is where we subscribe to global time period */
    this.timePeriodService.getGlobalTimePeriod().subscribe(period => {
      for (let i = 0; i < this.periods.length; i++) {
        if(this.periods[i].value == period){
          this.perdiodRangeLabel = this.periods[i].label;
        }
      }
    });
    /* */    
  }

  setTheme(){
    if(this.themeValue == 'light-theme'){
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }else{
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }
  }

  selectCurrency(currency){
    this.currencyName = currency.label;
    this.currencyService.setGlobalCurrency(currency);
  }

  selectNetwork(){
    if(this.networkToggle != true){
      this.networkValue = 'multichain_chaosnet';
      this.networkLabel = 'MCCN';
    }else{
      this.networkValue = 'singlechain_chaosnet';
      this.networkLabel = 'SCCN';
    }
    this.networkChainService.setGlobalNetwork(this.networkValue);
  }

  getNetworkClass(): string{
    let toggleClass = '';
    if(this.networkToggle == true){
      toggleClass = 'mccn';
    }else{
      toggleClass = 'sccn';
    }

    return 'network-toggle desktop ' + toggleClass;

  }

  selectPeriod(value: string, label: string){
    this.perdiodRangeValue = value;
    this.perdiodRangeLabel = label;
	  this.timePeriodService.setGlobalTimePeriod(this.perdiodRangeValue);
  }

  getPeriod(value: string,label: string){

    if(this.endDate != ''){
      this.startDate = '';
      this.endDate = '';
    }

    if(this.perdiodRangeValue != value){
      this.perdiodRangeValue = value;
      this.perdiodRangeLabel = label;
    }else{
      this.perdiodRangeValue = '1Y';
      this.perdiodRangeLabel = '1Y';
    }
    //set global time period
    this.timePeriodService.setGlobalTimePeriod(this.perdiodRangeValue);
  }

  setColor(label){
    if(this.perdiodRangeLabel == label){
      return 'accent';
    }else{
      return 'grey';
    }
  }

  toggleSidebar() {
    let toggle = 'compacted';  
    this.toggle.emit(toggle);
  }

  inputEvent(input: string, event){
    if(input == 'end' && event.value != null){
      if(this.endDate == ''){
        this.getPeriod('','range');
      }
      this.endDate = event.value;
    }
    if(input == 'start'){
      this.startDate = event.value;
    }
  }

  changeEvent(input: string, event){
    if(input == 'end' && event.value != null){
      this.getPeriod('','range');
    }
  }

  logout(){
    this.router.navigate(['/']);
  }

}

