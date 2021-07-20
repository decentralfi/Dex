import { Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import {MatDialog} from '@angular/material/dialog';
import { WalletData } from '../../interfaces/marketcap';

/* Master Wallet Manager */
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';

@Component({
  selector: 'dcf-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public logoFile  = 'decentralfi-logo.svg';
  public midgardStatus: boolean;
  public thornodeStatus: boolean;
  public statusValue:string = 'MIDGARD API';
  public statuses = [
    {label:'MIDGARD API', value: 'midgard.thorchain.info', status: true},
    {label:'THORNODE', value: 'thornode.thorchain.info', status: true},
  ];
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public addresses: WalletData[] = [];
  public bnbAddress: WalletData[] = [];
  public bnbAddressMask: string;
  public currencyValue:string = 'USD';
  public currencyName:string = 'USD';
  public currencies = [
    {label:'RUNE', value: 'RUNE'},
    {label:'USD', value: 'USD'},
    //{label:'ASSET', value: 'ASSET'},
  ];
  public isToggle: boolean;
  public themeValue = '';
  public walletData: any;

  public asset: string;
  public assetLabel: string;
  public selectedWallet: string;
  public selectedWalletLabel: string;

  public isBNB: boolean = false;
  public networkToggle: boolean = true;
  public showHideToggle: boolean = true;
  public networkLabel:string = 'MCCN';
  public networkValue:string = 'multichain_chaosnet';

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private chartThemeService: GlobalChartsThemeService,
    private activeRoute: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private masterWalletManagerService: MasterWalletManagerService,

  ) { }

  ngOnInit() {

    this.activeRoute.queryParams.subscribe(params => {
      this.masterWalletManagerService.getOriginalPools().subscribe(pools => {
        if(pools != null){
          this.masterWalletManagerService.walletData$.subscribe(details => {
            if(details != null){
              if(params.wallet){
                let walletExist = details.filter( wallet => wallet.address == params.wallet);
                if (walletExist.length != 0){
                  this.selectedWalletLabel = walletExist[0].mask;
                  if(walletExist[0].chain == 'BNB'){
                    this.isBNB = true;
                  }else{
                    this.isBNB = false;
                  }
                }
              }
              this.addresses = details;
            }else{
              if(params.wallet){
                let walletData = this.masterWalletManagerService.createWalletData(params.wallet);
                this.masterWalletManagerService.findBalance(walletData,this.currencyName).subscribe();
                if(walletData.chain == 'BNB'){
                  this.isBNB = true;
                }else{
                  this.isBNB = false;
                }
              }
            }
          });
        }
      });
    });


    if(this.router.url.includes('liquidity') == true){
      this.currencies = [
        {label:'RUNE', value: 'RUNE'},
        {label:'USD', value: 'USD'},
        {label:'ASSET', value: 'ASSET'},
      ];
    }else{
      this.currencies = [
        {label:'RUNE', value: 'RUNE'},
        {label:'USD', value: 'USD'},
      ];
    }

    this.masterWalletManagerService.midgardStatus$.subscribe(status => status != null ? this.midgardStatus = status : null);
    this.masterWalletManagerService.thornodeStatus$.subscribe(status => status != null ? this.thornodeStatus = status : null);

    if(this.activeRoute.snapshot.params.asset){
      let assetName = this.masterWalletManagerService.getAssetName(this.activeRoute.snapshot.params.asset);
      this.asset = this.activeRoute.snapshot.params.asset;
      this.assetLabel = 'Pool/' + assetName.chain + '.' + assetName.ticker;
      console.log(this.asset);
    }

    this.themeValue = localStorage.getItem('dcf-theme');
    if(this.themeValue == '' || this.themeValue == 'light-theme'){
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.isToggle = false;
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }else{
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.isToggle = true;
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    this.masterWalletManagerService.globalNetwork$.subscribe(net => {
      if(net != 'MCCN'){
        this.networkToggle = false;
      }else{
        this.networkToggle = true;
      }
    });
  }

  goToDashboard(){
    //window.open('app/', "_self");
    this.router.navigate(['app']);
  }

  getOverallHealthStatus(){

    if(!this.midgardStatus && !this.thornodeStatus){
      return 'status-dot red';
    }else if(this.midgardStatus == true && this.thornodeStatus == true){
      return 'status-dot green';
    }else if(this.midgardStatus && this.midgardStatus == true){
      return 'status-dot yellow';
    }
  }

  getHealthStatus(label){

    if(label == 'MIDGARD API'){
      if (!this.midgardStatus){
        return 'status-dot red';
      }else if(this.midgardStatus == true){
        return 'status-dot green';
      }else if(this.midgardStatus == false){
        return 'status-dot yellow';
      }
    }else{
      if (!this.thornodeStatus){
        return 'status-dot red';
      }else if(this.thornodeStatus == true){
        return 'status-dot green';
      }else if(this.thornodeStatus == false){
        return 'status-dot yellow';
      }
    }
    
  }

  selectCurrency(label,value){
    this.currencyName = label;
    this.masterWalletManagerService.setCurrency(label);
    this.masterWalletManagerService.createResume(this.currencyName);
  }

  setTheme(){
    if(this.themeValue == 'light-theme'){
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
    }else{
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
    }
  }

  selectWallet(address: WalletData){
    this.selectedWallet = address.address;
    this.selectedWalletLabel = this.getMask(address.address);
    this.router.navigate(['/liquidity'], { queryParams: { wallet: address.address } });
    //window.open('liquidity?wallet=' + address.address, '_blank').focus();
  }

  getAddress(){
    return this.addresses[0].address;
  }

  getWalletPanelClass(){
    let panelClass = '';
    if(this.themeValue == 'light-theme'){
      panelClass = 'wallet-select-panel light';
    }else{
      panelClass = 'wallet-select-panel dark';
    }
    return panelClass;
  }

  getMask(address: string){

    let addressLenght = address.length;
    let mask = address.slice(0,8)  + '....' + address.slice(addressLenght - 8, addressLenght);

    return mask;
    
  }

  logout(){
    this.router.navigate(['/']);
  }

  selectNetwork(){
    if(this.networkToggle != true){
      this.networkLabel = 'MCCN';
    }else{
      this.networkLabel = 'SCCN';
    }
    this.masterWalletManagerService.setGlobalNetwork(this.networkLabel);
  }

  selectShowHide(){
    let toggle: boolean = true;
    if(this.showHideToggle == true){
      toggle = false
    }else{
      toggle = true;
    }
    this.masterWalletManagerService.setGlobalShowHide(toggle);
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

  getShowHideClass(): string{
    let toggleClass = '';
    if(this.showHideToggle == true){
      toggleClass = 'show-amount';
    }else{
      toggleClass = 'hide-amount';
    }

    return 'show-hide-toggle desktop ' + toggleClass;

  }

}
