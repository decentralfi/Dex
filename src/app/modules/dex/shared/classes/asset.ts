import { CoinIconsFromTrustWallet } from '../constants/icon-list';

export class Asset {

    chain: string;
  symbol: string;
  ticker: string;
  iconPath: string;

  constructor(poolName: string) {
    const {chain, symbol, ticker } = this.getAssetFromString(poolName);
    this.chain = chain;
    this.symbol = symbol;
    this.ticker = ticker;

    const trustWalletMatch = CoinIconsFromTrustWallet[this.ticker];

    if (trustWalletMatch) {
      this.iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
    }else{
      // Override token icons when not found in trustwallet
      switch (poolName){
        case 'BNB.BNB':
          this.iconPath =  'https://chaosnet.bepswap.com/static/media/coin-bnb.25324922.svg';
          break;
        default:
          console.warn(`Icon not available for poolName ${poolName}. Add override in classes\\asset.ts`);
          this.iconPath = 'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png';
          break;
      }
    }

  }

    getAssetFromString(poolName: string): {
        chain: string;
        symbol: string;
        ticker: string;
      } {
        let chain: string;
        let symbol: string;
        let ticker: string;
    
        const data = poolName.split('.');
        if (poolName.includes('.')) {
          chain = data[0];
          symbol = data[1];
        } else {
          symbol = data[0];
        }
        if (symbol) {
          ticker = symbol.split('-')[0];
        }
    
        return { chain, symbol, ticker };
      }
}
