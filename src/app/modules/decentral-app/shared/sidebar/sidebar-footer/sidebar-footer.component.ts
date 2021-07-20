import {Router} from '@angular/router';
import { environment } from 'src/environments/environment';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { CurrencyService } from '../../services/currency.service';
import { GlobalCurrencyService } from '../../services/global-currency.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { NetworkChainService } from '../../../shared/services/network-chain.service';

@Component({
  selector: 'dcf-sidebar-footer',
  templateUrl: './sidebar-footer.component.html',
  styleUrls: ['./sidebar-footer.component.scss']
})
export class SidebarFooterComponent implements OnInit {

  @Input() mobileFlag: boolean;
  @Output() toggle = new EventEmitter<string>();
  public toggleclass: string = 'compacted';
  public binanceExplorerUrl: string;
  public bnbAddress: string = '';
  public bnbAddressMask: string = '';
  public bnbAccount: any;
  public walletData: any;
  public wallet: string;

  public showWalletConnect: boolean;
  public showManualInput: boolean;
  public showKeystore: boolean;
  public showManual: boolean;
  
  public themeValue: string = '';
  public isToggle: boolean;
  public logoFile: string;
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;


  faQuestionCircle = faQuestionCircle;

  public currencyName:string = 'RUNE';
  public currencyValue:string = 'RUNE';

  public currencies = [];

  public networks = [
    { label:'SCCN', value: 'singlechain_chaosnet' },
    { label:'MCCN', value: 'multichain_chaosnet' },
  ];
  
  public networkToggle: boolean = true;
  public networkLabel:string = 'MCCN';
  public networkValue:string = 'multichain_chaosnet';

  public selectedWallet: string;
  public selectedWalletLabel: string;
  
  constructor(private currencyService: GlobalCurrencyService,private currenciesService: CurrencyService,
    private router: Router,
    private chartThemeService: GlobalChartsThemeService,
    private networkChainService: NetworkChainService
    ) {
      this.binanceExplorerUrl = environment.network === 'testnet'
    ? 'https://testnet-explorer.binance.org/'
    : 'https://explorer.binance.org/';
     }

  ngOnInit() {

    this.themeValue = localStorage.getItem('dcf-theme');
    if(this.themeValue == '' || this.themeValue == 'light-theme'){
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }else{
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    this.chartThemeService.getGlobalChartTheme().subscribe(theme =>{
      if(theme == 'light-theme'){
        this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
      }else{
        this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
      }
    });

    this.currenciesService.getCurrencies(this.networkValue).subscribe((data: Array<any>) => {
      for (let i = 0; i < data.length; i++) {
        
        let findDot = data[i].name.indexOf('.');
        let findDash = data[i].name.indexOf('-');
        let label = findDash == -1 ? data[i].name.substr(findDot + 1) : data[i].name.substr(findDot + 1,findDash - 4);

        let value = data[i].id;
        let element = {label,value};

        this.currencies.push(element);
        
      }
    });

  }

  goTo(){ 
    if(this.mobileFlag == true){
      this.toggle.emit(this.toggleclass);
    }
  }

  selectCurrency(name: string, id:number){
    this.currencyName = name;
    this.currencyService.setGlobalCurrency(id);
    this.goTo;
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

    return 'network-toggle mobile ' + toggleClass;

  }

}
