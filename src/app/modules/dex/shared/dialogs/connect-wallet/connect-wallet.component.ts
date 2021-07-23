import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { getAddressFromPrivateKey, getPrivateKeyFromKeyStore } from '@binance-chain/javascript-sdk/lib/crypto';
import { BinanceService } from '../../services/binance.service';
/* Master Wallet Manager */
import { MasterWalletManagerService } from '../../../../../services/master-wallet-manager.service';
import * as bchRegex  from 'bitcoincash-regex';


@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.component.html',
  styleUrls: ['./connect-wallet.component.scss']
})
export class ConnectWalletComponent implements OnInit {

  public showKeyStoreForm: boolean;
  public file: any;
  public keystorePassword: string;
  public manualWallet: string;
  public keystoreFileSelected: boolean;
  public keystore: any;
  public keystoreConnecting: boolean;
  public keystoreError: boolean;
  public fileName: string;
  public keystoreErrorMsg: string;
  public showWalletConnect: boolean;
  public showManualInput: boolean;
  public showKeystore: boolean;
  public showManual: boolean;
  public manualInputError: boolean;
  public manualInputErrorMsg: string;
  public rememberWallet: boolean = false;
  public bitcoinRegex: RegExp = /^(?:[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,33}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/;
  public litecoinRegex: RegExp = /(?:^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}|tltc[a-z0-9]{39,59}|ltc[a-z0-9]{39,59}$)/;
  public ethereumRegex: RegExp = /^0x[a-fA-F0-9]{40}$/;
  public binanceRegex: RegExp = /^(?:tbnb[a-z0-9]{39,59}|bnb[a-z0-9]{39,59})$/;
  public thorchainRegex: RegExp = /^(?:thor[a-z0-9]{39,59}|tthor[a-z0-9]{39,59})$/;

  constructor(
    public dialogRef: MatDialogRef<ConnectWalletComponent>,
    @Inject(MAT_DIALOG_DATA) public selection: any,
    private binanceService: BinanceService,
    private marketcapService: MasterWalletManagerService,
  ) { }

  ngOnInit() {
    this.showWalletConnect = this.selection.showWalletConnect;
    this.showKeystore = this.selection.showKeystore;
    this.showManual = this.selection.showManual;

    this.marketcapService.getOriginalPools().subscribe(data => {
      if(data == null){
        this.marketcapService.getPools('USD').subscribe();
      }
    });
  }

  async onKeystoreFileChange(event: Event) {
    this.keystoreFileSelected = true;

    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {

      const keystoreFile = files[0];
      this.fileName = keystoreFile.name;

      const reader = new FileReader();

      const onLoadHandler = () => {
        try {
          const key = JSON.parse(reader.result as string);
          if (!('version' in key) || !('crypto' in key)) {
            this.keystoreError = true;
            this.keystoreErrorMsg = 'Not a valid keystore file';
            console.error('not a valid keystore file');
          } else {
            this.keystoreError = false;
            this.keystore = key;
          }
        } catch {
          this.keystoreError = true;
          this.keystoreErrorMsg = 'Not a valid json file';
          console.error('not a valid json file');
        }
      };
      reader.addEventListener('load', onLoadHandler);

      await reader.readAsText(keystoreFile);

    }

  }

  async keystoreUnlockClicked() {

    if(this.fileName && this.fileName.length > 0){
      if(this.keystorePassword && this.keystorePassword.length > 0){
        this.keystoreConnecting = true;
        this.keystoreError = false;

        setTimeout(() => {
          this.keystoreUnlock();
        }, 100); 
      }else{
        this.keystoreError = true;
        this.keystoreErrorMsg = 'Password is empty';
      }
    }else{
      this.keystoreError = true;
      this.keystoreErrorMsg = 'No file selected';
    }

    if(this.manualWallet.length > 0){

      let isBitcoin = this.bitcoinRegex.test(this.manualWallet);
      let isEthereum = this.ethereumRegex.test(this.manualWallet);
      let isBCH = bchRegex({exact: true}).test(this.manualWallet);
      let isLitecoin = this.litecoinRegex.test(this.manualWallet);
      let isBinance = this.binanceRegex.test(this.manualWallet);
      let isThorchain = this.thorchainRegex.test(this.manualWallet);
      let chain = '';
      let mask = this.getMask(this.manualWallet);
      let logo = '';
      this.manualInputError = false;

      this.marketcapService.walletData$.subscribe(walletData => {

        if(isBitcoin == true){
          chain = 'BTC';
          logo = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
        }else if(isEthereum == true){
          chain = 'ETH';
          logo = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/ETH-1C9/logo.png';
        }else if(isBCH == true){
          chain = 'BCH';
          logo = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BCH-1FD/logo.png';
        }else if(isLitecoin == true){
          chain = 'LTC';
          logo = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/LTC-F07/logo.png';
        }else if(isBinance == true){
          chain = 'BNB';
          logo = 'https://chaosnet.bepswap.com/static/media/coin-bnb.25324922.svg';
        }else if(isThorchain == true){
          chain = 'THOR';
          logo = 'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png';
        }else{
          this.manualInputError = true;
          this.manualInputErrorMsg = 'Not Valid Address';
        }

        if(walletData != null){
          let duplicate = walletData.filter(data => data.address == this.manualWallet);
          if(duplicate.length > 0){
            this.manualInputError = true;
            this.manualInputErrorMsg = 'The address already exists';
          }
        }
  
        if(this.manualInputError == false){
          const wallet = {type: 'manual', address: this.manualWallet, chain: chain, mask: mask, logo: logo, remember: this.rememberWallet};
          this.dialogRef.close(wallet);
        }
      });
    }

  }

  async keystoreUnlock() {

    this.keystoreError = false;

    try {
      // save a copy of keystore on local storage
      localStorage.setItem('dcf_keystore', JSON.stringify(this.keystore));

      const privateKey = getPrivateKeyFromKeyStore(this.keystore, this.keystorePassword);
      await this.binanceService.bncClient.setPrivateKey(privateKey);

      const prefix = this.binanceService.getPrefix();
      const address = getAddressFromPrivateKey(privateKey, prefix);
      const wallet = {type: 'keystore', wallet: address};

      if(address.length > 0){
        this.dialogRef.close(wallet);
      }

      //TODO: config multichain
      //const user = await this.keystoreService.unlockKeystore(this.keystore, this.keystorePassword);


    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      this.keystoreErrorMsg = 'Invalid password';
      console.error(error);
    }

  }

  walletConnect(selection){

    this.selection = selection;
    if(this.selection == 'walletconnect'){
      const wallet = {type: 'walletconnect'};
      this.dialogRef.close(wallet);
    }else if(this.selection == 'keystore'){
      this.showKeyStoreForm = true;
    }else{
      this.showManualInput = true;
    }
  
  }

  back(){
    this.showKeyStoreForm = false;
    this.showManualInput = false;
  }

  closeDialog(){
    this.dialogRef.close();
  }

  getMask(address: string){

    let addressLenght = address.length;
    let mask = address.slice(0,4)  + '....' + address.slice(addressLenght - 4, addressLenght);

    return mask;
    
  }

  rememberWalletFn(){
    if(this.rememberWallet == false){
      this.rememberWallet = true
    }else{
      this.rememberWallet = false;
    }
  }

}
