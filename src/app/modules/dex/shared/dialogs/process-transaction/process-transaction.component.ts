import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import WalletConnect from "@walletconnect/client";
import { tokenAmount, tokenToBase } from '@thorchain/asgardex-token';
import { MidgardService } from '../../services/midgard.service';
import { SlippageToleranceService } from '../../services/slippage-tolerance.service';
import { BinanceService } from '../../services/binance.service';
import { TransactionConfirmationState } from '../../constants/transaction-confirmation-state';
import { PoolAddressDTO } from '../../classes/pool-address';
import { environment } from 'src/environments/environment';
import { TransferResult } from '@thorchain/asgardex-binance';
import base64js from 'base64-js';
const bech32 = require('bech32');

export interface SwapData {
  type: string;
  sourceAsset;
  targetAsset;
  runeFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue: number;
  wallet: string;
  slip: number;
}

@Component({
  selector: 'app-process-transaction',
  templateUrl: './process-transaction.component.html',
  styleUrls: ['./process-transaction.component.scss'],
  //providers: [binanceClient]
})
export class ProcessTransactionComponent implements OnInit {

  public status: string = 'process';
  public resultIcon: string; // cancel //check_circle
  public txState: TransactionConfirmationState;
  public hash: string;
  public walletConnector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org", // Required
  });
  public binanceExplorerUrl: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ProcessTransactionComponent>,
    private slipLimitService: SlippageToleranceService,
    private binanceService: BinanceService,
    private midgardService: MidgardService,
    ) { 
      this.binanceExplorerUrl = environment.network === 'testnet'
      ? 'https://testnet-explorer.binance.org/'
      : 'https://explorer.binance.org/';
    }

  ngOnInit() {
    this.submitTransaction();
  }

  submitTransaction() {

    this.txState = TransactionConfirmationState.SUBMITTING;
    this.status = 'process';

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === this.swapData.sourceAsset.chain );

          if (matchingPool) {

            //this.walletConnectTransfer(matchingPool);

            if (this.swapData.type === 'keystore' || this.swapData.type === 'ledger') {
              this.keystoreTransfer(matchingPool);
            } else if (this.swapData.type === 'walletconnect') {
              this.walletConnectTransfer(matchingPool);
            }

          }

        }

      }
    );

  }

  async keystoreTransfer(matchingPool: PoolAddressDTO) {

    const bncClient = this.binanceService.bncClient;

    await bncClient.initChain();

    // Check of `validateSwap` before makes sure that we have a valid number here
    const amountNumber = this.swapData.inputValue;

    // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
    const floor = this.slipLimitService.getSlipLimitFromAmount(this.swapData.outputValue);
    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      this.swapData.wallet,
      Math.floor(floor.toNumber())
    );

    bncClient
      .transfer(this.swapData.wallet, matchingPool.address, amountNumber, this.swapData.sourceAsset.symbol, memo)
      .then((response: TransferResult) => {
        this.txState = TransactionConfirmationState.SUCCESS;
        this.status = 'sucess';
        this.resultIcon = 'check_circle';

        if (response.result && response.result.length > 0) {
          this.hash = response.result[0].hash;
          console.log(this.hash);
        }

      })
      .catch((error: Error) => {
        console.error('error making transfer: ', error);
        this.txState = TransactionConfirmationState.ERROR;
        this.status = 'error';
        this.resultIcon = 'cancel';
      });
  }

  walletConnectTransfer(matchingPool: PoolAddressDTO) {

    console.log('aqui');

    const coins = [{
      denom: this.swapData.sourceAsset.symbol,
      amount: tokenToBase(tokenAmount(this.swapData.inputValue))
        .amount()
        .toNumber(),
    }];

    const sendOrder = this.walletConnectGetSendOrderMsg({
      fromAddress: this.swapData.wallet,
      toAddress: matchingPool.address,
      coins,
    });
    
    const floor = this.slipLimitService.getSlipLimitFromAmount(this.swapData.outputValue);

    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      this.swapData.wallet,
      Math.floor(floor.toNumber())
    );

    const bncClient = this.binanceService.bncClient;

    bncClient
      .getAccount(this.swapData.wallet)
      .then( async (response) => {

        console.log(response);

        if (!response) {
          console.error('no response getting account:', response);
          return;
        }

        const account = response.result;
        const chainId = environment.network === 'testnet' ? 'Binance-Chain-Nile' : 'Binance-Chain-Tigris';

        const tx = {
          from: account.account_number.toString(),
          to: matchingPool.address,
          data: ''
        };

        const res = await this.walletConnectSendTx(tx, bncClient);

        if (res) {
          this.txState = TransactionConfirmationState.SUCCESS;
          this.status = 'sucess';
          this.resultIcon = 'check_circle';

          if (res.result && res.result.length > 0) {
            this.hash = res.result[0].hash;
            console.log(this.hash);
          }
        }


      })
      .catch((error) => {
        console.error('getAccount error: ', error);
        this.txState = TransactionConfirmationState.ERROR;
        this.status = 'error';
        this.resultIcon = 'cancel';
      });

  }

  walletConnectSendTx(tx, bncClient): Promise<TransferResult> {

    const NETWORK_ID = 714;

    return new Promise( (resolve, reject) => {
      this.walletConnector
      .signTransaction(tx)
      .then((result) => {

        bncClient
          .sendRawTransaction(result, true)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        console.error('trustSignTransaction error: ', error);
        reject(error);
      });
    });

  }

  walletConnectGetSendOrderMsg({
    fromAddress,
    toAddress,
    coins: coinData,
  }) {
    // 1. sort denoms by alphabet order
    // 2. validate coins with zero amounts
    const coins = coinData
      .sort((a, b) => a.denom.localeCompare(b.denom))
      .filter(data => {
        return data.amount > 0;
      });

    // if coin data is invalid, return null
    if (!coins.length) {
      return null;
    }

    const msg = {
      inputs: [
        {
          address: this.getByteArrayFromAddress(fromAddress),
          coins,
        },
      ],
      outputs: [
        {
          address: this.getByteArrayFromAddress(toAddress),
          coins,
        },
      ],
    };

    return msg;
  }

  getByteArrayFromAddress(address: string) {
    const decodeAddress = bech32.decode(address);
    return base64js.fromByteArray(Buffer.from(bech32.fromWords(decodeAddress.words)));
  }

  getSwapMemo(chain: string, symbol: string, addr: string, sliplimit: number) {
    return `SWAP:${chain}.${symbol}:${addr}:${sliplimit}`;
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
