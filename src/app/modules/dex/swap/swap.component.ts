import { Component, OnInit, HostBinding } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'src/environments/environment';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import {MatDialog} from '@angular/material/dialog';
import { ConnectWalletComponent } from '../shared/dialogs/connect-wallet/connect-wallet.component';
import { ForgetWalletComponent } from '../shared/dialogs/forget-wallet/forget-wallet.component';
import {
  Client as binanceClient,
  BinanceClient,
} from '@thorchain/asgardex-binance';
import { Market, MarketResponse } from '../shared/interfaces/market';
import { WalletBalanceService } from '../shared/services/wallet-balance.service';
import { AssetsDialogComponent } from '../shared/dialogs/assets-dialog/assets-dialog.component';
import { ProcessTransactionComponent } from '../shared/dialogs/process-transaction/process-transaction.component';
import { AssetBalance } from '../shared/interfaces/asset-balance';
import { Asset } from '../shared/classes/asset';
import { formatNumber, DecimalPipe } from '@angular/common';
import {
  bn,
  getSwapOutputWithFee,
  getDoubleSwapOutput,
  getDoubleSwapOutputWithFee,
  getSwapSlip,
  getDoubleSwapSlip,
  baseAmount,
  BaseAmount,
  PoolData,
  assetToBase,
  assetAmount,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
} from '@thorchain/asgardex-util';
import { MidgardService } from '../shared/services/midgard.service';
import { BinanceService } from '../shared/services/binance.service';
import { PoolDetail } from '../shared/classes/pool-detail';
import BigNumber from 'bignumber.js';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})
export class SwapComponent implements OnInit {

  @HostBinding('class') componentCssClass: any = 'full';
  
  asgardexBncClient: BinanceClient;

    // Create a connector
    public connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org", // Required
      qrcodeModal: QRCodeModal,
    });
  
    public isToggle: boolean;
    public isStake: boolean = false;
    public stakeToggleLabel: string = 'Swap';
    public logoFile: string = 'DecentralFi-footer.svg';
    public themeValue = '';
    public bnbAddress: string = '';
    public bnbAddressMask: string;
    public bnbAccount: any;
    public dialogBackdropColorClass: string;
    public dialogPanelClass: string;
    public walletData: any;
    public binanceExplorerUrl: string;


    public wallet: string;
    public hintIn: string = 'Select your asset';
    public hintOut: string = 'Select your asset';
    public balances: AssetBalance[];
    public balanceIn: number;
    public balanceOut: number;
    public assetUnitIn: number = 0;
    public assetUnitOut: number = 0;
    public assetUnitInHint: string;
    public swapIsValid: boolean;
    public showConfirm: boolean;
    public rune = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';
    public bnb = 'BNB';
    public assetIn: Asset = new Asset(`BNB.${this.rune}`);
    public assetOut: Asset = new Asset(`BNB.${this.bnb}`);
    public basePrice: number;
    public assetTokenValueIn: BaseAmount;
    public slip: number;
    public calculatingTargetAsset: boolean;
    public poolDetailOutError: boolean;
    public poolDetailInError: boolean;
    public poolDetailMap: {
      [key: string]: PoolDetail
    } = {};
    public targetAssetUnit: BigNumber;
    public binanceTransferFee: BigNumber;
    public binanceTransferFeeDisplay: number;
    public runeTransactionFee: number;

    constructor(
      private chartThemeService: GlobalChartsThemeService,
      private router: Router,
      private route:ActivatedRoute,
      public dialog: MatDialog,
      public walletBalanceService: WalletBalanceService,
      private midgardService: MidgardService,
      private binanceService: BinanceService,
      private decimalPipe: DecimalPipe
      ) { 
        this.asgardexBncClient = new binanceClient({
          network: (environment.network) === 'testnet' ? 'testnet' : 'mainnet',
        });
  
        this.binanceExplorerUrl = environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org/'
        : 'https://explorer.binance.org/';
      }

  ngOnInit() {
    this.themeValue = localStorage.getItem('dcf-theme');
    if(this.themeValue == '' || this.themeValue == 'light-theme'){
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.isToggle = false;
      //this.componentCssClass = this.themeValue;
      this.logoFile  = 'DecentralFi-footer.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }else{
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.isToggle = true;
      //this.componentCssClass = this.themeValue;
      this.logoFile  = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    if(this.route.parent.snapshot.routeConfig.path == 'add'){
      this.isStake = true;
      this.stakeToggleLabel = 'Add';
    }

    this.walletBalanceService.wallet$.subscribe(wallet => {
      if(wallet != null){
        this.wallet = wallet;
      }else{
        this.clean();
      }
    });

    this.walletBalanceService.walletData$.subscribe(data => {
      this.walletData = data;
    });

    this.walletBalanceService.walletBalances$.subscribe(balance => {
      this.balances = balance;
      if(this.balances != null){
        for (let i = 0; i < this.balances.length; i++) {
          if(this.balances[i].asset == this.assetIn.ticker || this.balances[i].asset == this.rune){
            this.balanceIn = this.balances[i].assetValue.amount().toNumber();
            this.hintIn = 'Balance: ' + this.decimalPipe.transform(this.balanceIn, '1.2-4');
          }
          if(this.balances[i].asset == this.assetOut.ticker){
            this.balanceOut = this.balances[i].assetValue.amount().toNumber();
            this.hintOut = 'Balance: ' + this.decimalPipe.transform(this.balanceOut, '1.2-4');
          }
        }
      }
    });

    this.chartThemeService.getGlobalChartTheme().subscribe( theme => {
      this.themeValue = theme;
      if(this.themeValue == '' || this.themeValue == 'light-theme'){
        this.themeValue = 'light-theme';
        localStorage.setItem('dcf-theme',this.themeValue);
        //this.componentCssClass = this.themeValue;
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
        this.dialogPanelClass = 'wallet-connect-panel-light';
      }else{
        this.themeValue = 'dark-theme';
        localStorage.setItem('dcf-theme',this.themeValue);
        //this.componentCssClass = this.themeValue;
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
        this.dialogPanelClass = 'wallet-connect-panel-dark';
      }
    });

    this.getBinanceFees();
    this.getConstants();
  }

  setTheme(){
    if(this.themeValue == 'light-theme'){
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      //this.componentCssClass = this.themeValue;
      this.logoFile  = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }else{
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      //this.componentCssClass = this.themeValue;
      this.logoFile  = 'DecentralFi-footer.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }
  }

  addWallet(){
    let showWalletConnect = true;
    let showKeystore = true;
    let showManual = false;
    const dialogRef = this.dialog.open(ConnectWalletComponent,{
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: {showWalletConnect:showWalletConnect, showKeystore:showKeystore, showManual:showManual}
    });

    dialogRef.afterClosed().subscribe(wallet => {
      this.walletData = wallet;
      if(this.walletData.type == 'walletconnect'){
        this.connectWalletConnect();
      }else if(this.walletData.type == 'keystore'){
        this.setWallet(this.walletData.wallet);
        this.walletBalanceService.setWalletData(this.walletData);
      }else{
        this.setWallet(this.walletData.wallet);
        this.walletBalanceService.setWalletData(this.walletData);
      }
    });
  }

  forgetWallet(){
    const forgetDialogRef = this.dialog.open(ForgetWalletComponent,{
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass
      //maxWidth: '320px',
      //width: '40vw',
    });

    forgetDialogRef.afterClosed().subscribe(data => {
      if(data == true){
        if(this.walletData.type == 'walletconnect'){
          this.connector.killSession();
          this.bnbAddress = '';
          this.walletBalanceService.setWallet(null);
        }else if(this.walletData.type == 'keystore'){
          localStorage.removeItem('dcf_keystore');
          this.bnbAddress = '';
          this.walletBalanceService.setWallet(null);
          this.walletBalanceService.setWalletData(null);
          this.walletBalanceService.setWalletBalance(null);
        }
      }
    });
  }

  initWalletConnect(){
    // Create a connector
    this.connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org", // Required
      qrcodeModal: QRCodeModal,
    });
  }

  connectWalletConnect(){

    if(!this.connector){
      this.initWalletConnect();
    }

    // Check if connection is already established
    if (!this.connector.connected) {
      // create new session
      this.connector.connect();
      const uri = this.connector.uri;
      // display QR Code modal
      QRCodeModal.open(uri, () => {});
    
    }else{
      const uri = this.connector.uri;
      // display QR Code modal
      QRCodeModal.open(uri, () => {});
    }

    //console.log(QRCodeModal);

    // Subscribe to connection events
    this.connector.on("connect", (error, payload) => {
      if (error) {
        throw error;
      }

      //Get Binance Address
      this.connector.sendCustomRequest({
        method: 'get_accounts',
      }).then((data) => {
        this.bnbAccount = data.find( (account) => account.network === 714 );
        let wallet = this.bnbAccount.address;
        console.log(wallet);
        this.setWallet(wallet);
        this.walletBalanceService.setWalletData([{type:'walletconnect', address: wallet}]);
        
        // Close QR Code Modal
        setTimeout(() => {
          QRCodeModal.close();
        }, 500);
      });
      
    });

    this.connector.on("session_update", (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      //const { accounts, chainId } = payload.params[0];
      console.log(payload);
    });

    this.connector.on("disconnect", (error, payload) => {
      if (error) {
        throw error;
      }

      this.bnbAddress = '';
      this.connector = null; // Delete connector
      this.walletBalanceService.setWallet(null);
      this.walletBalanceService.setWalletData(null);
      this.walletBalanceService.setWalletBalance(null);
    });
  }

  setWallet(wallet: string){
    this.bnbAddress = wallet;
    let addressLenght = this.bnbAddress.length;
    this.bnbAddressMask = this.bnbAddress.slice(0,8)  + '.......' + this.bnbAddress.slice(addressLenght - 8, addressLenght);

    this.walletBalanceService.setWallet(wallet);
    this.walletBalanceService.getBalance(wallet);
  }

  async setMarkets() {
    const res: MarketResponse = await this.asgardexBncClient.getMarkets({});
    if (res.status === 200) {
      const markets = res.result.map( (dto) => new Market(dto) );
      //this.marketsSource.next(markets);
    }
  }

  walletDetails(){
    window.open(this.binanceExplorerUrl + 'address/' + this.bnbAddress, "_blank");
  }

  setAsset(field: string){

    let selectedToken = '';
    if(field == 'out'){
      selectedToken = this.assetIn.ticker;
    }else{
      selectedToken = this.assetOut.ticker;
    }

    const dialogRef = this.dialog.open(AssetsDialogComponent,{
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: {field: field, disabledAssetSymbol: selectedToken}
    });

    dialogRef.afterClosed().subscribe(selection => {
      if(selection != undefined){
        if(selection.field == 'in'){
          this.assetIn = selection.item.asset;
          this.getPoolDetails(this.assetIn.chain,this.assetIn.symbol, 'in');
          if(selection.item.balance != undefined){
            this.balanceIn = selection.item.balance.assetValue.amount().toNumber();
            this.hintIn = 'Balance: ' + this.decimalPipe.transform(this.balanceIn, '1.2-4');
          }else{
            this.balanceIn = 0;
            if(this.balances != null){
              this.hintIn = 'Balance: 0';
            }
          }
        }else{
          this.assetOut = selection.item.asset;
          this.getPoolDetails(this.assetOut.chain,this.assetOut.symbol, 'out');
          this.updateSwapDetails();
          if(selection.item.balance != undefined){
            this.balanceOut = selection.item.balance.assetValue.amount().toNumber();
            this.hintOut = 'Balance: ' + this.decimalPipe.transform(this.balanceOut, '1.2-4');
          }else{
            if(this.balances != null){
              this.balanceOut = 0;
              this.hintOut = 'Balance: 0';
            }
          }
        }

        if(this.assetUnitIn > this.balanceIn){
          this.assetUnitInHint = 'Not enough balance';
          this.swapIsValid = false;
        }else{
          this.assetUnitInHint = '';
          this.swapIsValid = true;
        }
      }
    });
  }

  setMax() {
    if (this.balanceIn) {
      let max = this.maximumSpendableBalance(this.assetIn.ticker, this.balanceIn);
      this.assetUnitIn = 0;
      this.assetUnitIn = +formatNumber(Number(max), 'en-US', '0.0-8');
      this.assetUnitInHint = '';
      this.swapIsValid = true;

      this.assetTokenValueIn = assetToBase(assetAmount(this.assetUnitIn));
      if (this.assetIn && this.assetIn.symbol !== this.rune) {
        this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
      } else if (this.assetIn && this.assetIn.symbol === this.rune) {
        this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
        this.updateSwapDetails();
      }
    }

  }

  maximumSpendableBalance(asset: string, balance: number) {

    if (asset == 'BNB') {
      let max = balance - 0.01 - 0.000375;
      return (max >= 0) ? max : 0;
    } else {
      return balance;
    }

  }

  updateAssetUnits(val){
    this.assetUnitIn = val;
    if(this.assetUnitIn > this.balanceIn){
      this.assetUnitInHint = 'Not enough balance';
      this.swapIsValid = false;
    }else{
      this.assetUnitInHint = '';
      this.swapIsValid = true;
    }

    this.assetTokenValueIn = assetToBase(assetAmount(val));
    if (this.assetIn && this.assetIn.symbol !== this.rune) {
      this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
    } else if (this.assetIn && this.assetIn.symbol === this.rune) {
      this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
      this.updateSwapDetails();
    }
  }

  updateSwapDetails() {
    if (this.assetIn && this.assetOut) {
      this.calculateTargetUnits();
    } else {
      this.calculatingTargetAsset = false;
    }
  }

  calculateTargetUnits() {

    if (this.assetTokenValueIn) {

      const swapType = this.assetIn.symbol === this.rune || this.assetOut.symbol === this.rune
        ? SwapType.SINGLE_SWAP
        : SwapType.DOUBLE_SWAP;

      if (swapType === SwapType.SINGLE_SWAP) {
        this.calculateSingleSwap();
      }else if (swapType === SwapType.DOUBLE_SWAP
          && this.poolDetailMap[this.assetOut.symbol]
          && this.poolDetailMap[this.assetIn.symbol]) {

        this.calculateDoubleSwap();

      }

    } else {
      this.calculatingTargetAsset = false;
    }

  }

  /**
   * When RUNE is one of the assets being exchanged
   * For example RUNE <==> DAI
   */
  calculateSingleSwap() {

    const toRune = this.assetOut.symbol === this.rune
      ? true
      : false;

    const poolDetail = (toRune)
      ? this.poolDetailMap[this.assetIn.symbol]
      : this.poolDetailMap[this.assetOut.symbol];

    if (poolDetail) {
      const pool: PoolData = {
        assetBalance: baseAmount(poolDetail.assetDepth),
        runeBalance: baseAmount(poolDetail.runeDepth),
      };

      /**
       * TO SHOW BASE PRICE
       */

      const valueOfRuneInAsset = getValueOfRuneInAsset(assetToBase(assetAmount(1)), pool);
      const valueOfAssetInRune = getValueOfAssetInRune(assetToBase(assetAmount(1)), pool);

      const basePrice = (toRune)
        ? valueOfRuneInAsset
        : valueOfAssetInRune;
      this.basePrice = basePrice.amount().div(10 ** 8).toNumber();

      /**
       * Slip percentage using original input
       */
      const slip = getSwapSlip(this.assetTokenValueIn, pool, toRune);
      this.slip = slip.toNumber();

      /**
       * Total output amount in target units minus 1 RUNE
       */
      const totalAmount = getSwapOutputWithFee(baseAmount(this.assetTokenValueIn.amount()), pool, toRune);

      if (this.assetUnitIn) {
        this.targetAssetUnit = (totalAmount.amount().isLessThan(0)) ? bn(0) : totalAmount.amount();
      } else {
        this.targetAssetUnit = (this.assetUnitIn) ? (totalAmount.amount().isLessThan(0)) ? bn(0) : totalAmount.amount() : null;
      }

      this.assetUnitOut = Number(this.targetAssetUnit.div(10 ** 8).toPrecision());

    }

    this.calculatingTargetAsset = false;

  }

  calculateDoubleSwap() {

    const sourcePool = this.poolDetailMap[`${this.assetIn.symbol}`];
    const targetPool = this.poolDetailMap[`${this.assetOut.symbol}`];

    if (sourcePool && targetPool) {
      const pool1: PoolData = {
        assetBalance: baseAmount(sourcePool.assetDepth),
        runeBalance: baseAmount(sourcePool.runeDepth),
      };
      const pool2: PoolData = {
        assetBalance: baseAmount(targetPool.assetDepth),
        runeBalance: baseAmount(targetPool.runeDepth),
      };

      const basePrice = getDoubleSwapOutput(assetToBase(assetAmount(1)), pool1, pool2);
      this.basePrice = basePrice.amount().div(10 ** 8).toNumber();

      const slip = getDoubleSwapSlip(this.assetTokenValueIn, pool1, pool2);
      this.slip = slip.toNumber();

      const total = getDoubleSwapOutputWithFee(this.assetTokenValueIn, pool1, pool2);

      if (this.assetUnitIn) {
        this.targetAssetUnit = (total.amount().isLessThan(0)) ? bn(0) : total.amount();
      } else {
        this.targetAssetUnit = null;
      }

      this.assetUnitOut = Number(this.targetAssetUnit.div(10 ** 8).toPrecision());

    }

    this.calculatingTargetAsset = false;

  }

  getPoolDetails(chain: string, symbol: string, type: 'in' | 'out') {

    this.poolDetailOutError = (type === 'out') ? false : this.poolDetailOutError;
    this.poolDetailInError = (type === 'in') ? false : this.poolDetailInError;

    this.midgardService.getPoolDetails([`${chain}.${symbol}`], 'simple').subscribe(
      (res) => {

        if (res && res.length > 0) {
          this.poolDetailMap[symbol] = res[0];
          this.updateSwapDetails();
        }

      },
      (err) => {
        console.error('error fetching pool details: ', err);
        this.poolDetailOutError = (type === 'out') ? true : this.poolDetailOutError;
        this.poolDetailInError = (type === 'in') ? true : this.poolDetailInError;
      }
    );
  }

  getConstants() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this.runeTransactionFee = bn(res.int_64_values.TransactionFee).div(10 ** 8).toNumber();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }

  getBinanceFees() {
    this.binanceService.getBinanceFees().subscribe(
      (res) => {
        const binanceFees = res;
        const binanceTransferFees = this.binanceService.getTransferFees(binanceFees);
        this.binanceTransferFee = binanceTransferFees.single.amount();
        this.binanceTransferFeeDisplay = this.binanceTransferFee.div(10 ** 8).toNumber();
      }
    );
  }

  confirmSwap(){
    if(this.swapIsValid){
      if(this.basePrice && this.assetOut && this.assetIn){
        this.showConfirm = true;
      }
    }
  }

  backSwap(){
    this.showConfirm = false;
  }

  swap(){

    const forgetDialogRef = this.dialog.open(ForgetWalletComponent,{
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass
    });

    forgetDialogRef.afterClosed().subscribe(data => {
      if(data == true){
        
        const dialogRef = this.dialog.open(ProcessTransactionComponent,{
          autoFocus: false,
          backdropClass: this.dialogBackdropColorClass,
          panelClass: this.dialogPanelClass,
          disableClose: true,
          data: {
            type: this.walletData.type,
            sourceAsset: this.assetIn,
            targetAsset: this.assetOut,
            runeFee: this.runeTransactionFee,
            bnbFee: this.binanceTransferFeeDisplay,
            basePrice: this.basePrice,
            inputValue: this.assetUnitIn,
            outputValue: this.targetAssetUnit.div(10 ** 8),
            wallet: this.wallet,
            slip: this.slip
          }
        });
    
        dialogRef.afterClosed().subscribe(data => {
          this.clean();
          this.walletBalanceService.getBalance(this.wallet);
        });
      }
    });

  }

  clean(){
    this.showConfirm = false;
    this.swapIsValid = false;
    this.assetUnitOut = 0;
    this.assetUnitIn = 0;
    this.assetIn = new Asset(`BNB.${this.rune}`);
    this.assetOut = new Asset(`BNB.${this.bnb}`);
    this.balanceIn = null;
    this.balanceOut = null;
    this.hintIn = 'Select your asset';
    this.hintOut = 'Select your asset';
    this.assetUnitInHint = '';
  }

  assetSwap(){
    let _asset = this.assetIn;
    this.assetIn = this.assetOut;
    this.assetOut = _asset;

    let _assetUnit = this.assetUnitIn;
    this.assetUnitIn = this.assetUnitOut;
    this.assetUnitOut = _assetUnit;

    let _hint = this.hintIn;
    this.hintIn = this.hintOut;
    this.hintOut = _hint;

    let _balance = this.balanceIn;
    this.balanceIn = this.balanceOut;
    this.balanceOut = _balance;

    this.updateAssetUnits(this.assetUnitIn);
  }

  setStake(){
    if(this.isStake == true){
      this.stakeToggleLabel = 'Swap';
      this.router.navigate(['/dex/swap']);
    }else{
      this.stakeToggleLabel = 'Add';
      this.router.navigate(['/dex/add']);
    }
  }

}
