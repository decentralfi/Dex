import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AssetBalance } from '../interfaces/asset-balance';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
} from '@thorchain/asgardex-binance';
import { bnOrZero, bn } from '@thorchain/asgardex-util';
import {
  tokenAmount,
} from '@thorchain/asgardex-token';
import { Market, MarketResponse } from '../interfaces/market';

export interface WalletData {
  type: string;
  chain?: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class WalletBalanceService {

  asgardexBncClient: BinanceClient;

  private walletSource = new BehaviorSubject<string>(null);
  wallet$ = this.walletSource.asObservable();
  private walletData = new BehaviorSubject<WalletData[]>(null);
  walletData$ = this.walletData.asObservable();
  private walletBalancesSource = new BehaviorSubject<AssetBalance[]>(null);
  walletBalances$ = this.walletBalancesSource.asObservable();

  constructor() {
    this.asgardexBncClient = new binanceClient({
      network: (environment.network) === 'testnet' ? 'testnet' : 'mainnet',
    });
   }

  setWalletBalance(balance){
    this.walletBalancesSource.next(balance);
  }

  setWallet(wallet){
    this.walletSource.next(wallet);
  }

  setWalletData(data: WalletData[]){
    this.walletData.next(data);
  }

  async getBalance(address: string) {

    try {

      const balances = await this.asgardexBncClient.getBalance(address);

      const filteredBalance = balances.filter(
        (balance: Balance) => !this.isBEP8Token(balance.symbol),
      );

      const markets = await this.getMarkets();

      const coins = filteredBalance.map((coin: Balance) => {
        const market = markets.find(
          (m: Market) => m.baseAssetSymbol === coin.symbol,
        );
        return {
          asset: coin.symbol,
          assetValue: tokenAmount(coin.free),
          price: market ? bnOrZero(market.listPrice) : bn(0),
        } as AssetBalance;
      });

      this.setWalletBalance(coins);

    } catch (error) {
      console.error('error getting balance: ', error);
    }

  }

  async getMarkets(): Promise<Market[]> {
    const res: MarketResponse = await this.asgardexBncClient.getMarkets({});
    if (res.status === 200) {
      const markets = res.result.map( (dto) => new Market(dto) );
      return markets;
    }
  }

  private isBEP8Token(symbol: string): boolean {
    if (symbol) {
      const symbolSuffix = symbol.split('-')[1];
      if (
        symbolSuffix &&
        symbolSuffix.length === 4 &&
        symbolSuffix[symbolSuffix.length - 1] === 'M'
      ) {
        return true;
      }
      return false;
    }
    return false;
  }


}
