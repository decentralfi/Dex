import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import {map} from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Pool, MarketPool, DepthPriceHistory, Health, Queue, Stats, Network, PoolStats, PoolDetail, HistoryField, WalletData, WalletBalance, WalletLiquidity, NONLPDetail, AssetName, LiquidityTrack } from '../modules/dex/shared/interfaces/marketcap';
import { graphic } from 'echarts';
import { environment } from 'src/environments/environment';
import * as bchRegex  from 'bitcoincash-regex';
import BigNumber from 'bignumber.js';
import {RoundedValuePipe} from '../modules/dex/shared/pipes/rounded-value.pipe';
import { Resume, pieSerie, assetAmount } from '../modules/dex/shared/interfaces/liquidity';

import { CoinIconsFromTrustWallet, EthIconsFromTrustWallet } from '../modules/dex/shared/constants/icon-list';

const dfc_api = environment.endpoint;

@Injectable({
  providedIn: 'root'
})
export class MasterWalletManagerService {

  private globalNetwork = new BehaviorSubject<string>('MCCN');
  public globalNetwork$ = this.globalNetwork.asObservable();
  
  private globalShowHide = new BehaviorSubject<boolean>(null);
  public globalShowHide$ = this.globalShowHide.asObservable();

  public bitcoinRegex: RegExp = /^(?:[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,33}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/;
  public litecoinRegex: RegExp = /(?:^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}|tltc[a-z0-9]{39,59}|ltc[a-z0-9]{39,59}$)/;
  public ethereumRegex: RegExp = /^0x[a-fA-F0-9]{40}$/;
  public binanceRegex: RegExp = /^(?:tbnb[a-z0-9]{39,59}|bnb[a-z0-9]{39,59})$/;
  public thorchainRegex: RegExp = /^(?:thor[a-z0-9]{39,59}|tthor[a-z0-9]{39,59})$/;

  constructor(private http: HttpClient, private roundedPipe: RoundedValuePipe) { }

  private currency = new BehaviorSubject<string>('USD');
  public currency$ = this.currency.asObservable();
  private originalPools = new BehaviorSubject<Pool[]>(null);
  public originalPools$ = this.originalPools.asObservable();
  private originalPriceChange = new BehaviorSubject(null);

  private originalStats24h = new BehaviorSubject<PoolStats[]>(null);
  private originalStats7d = new BehaviorSubject<PoolStats[]>(null);
  private originalStats30d = new BehaviorSubject<PoolStats[]>(null);
  private originalStats3m = new BehaviorSubject<PoolStats[]>(null);
  private originalStats1y = new BehaviorSubject<PoolStats[]>(null);

  private totalVolume24H = new BehaviorSubject<number>(null);
  private totalVolume1M = new BehaviorSubject<number>(null);
  public totalVolume24H$ = this.totalVolume24H.asObservable();
  public totalVolume1M$ = this.totalVolume1M.asObservable();

  private totalSwap24H = new BehaviorSubject<number>(null);
  private totalSwap1M = new BehaviorSubject<number>(null);
  public totalSwap24H$ = this.totalSwap24H.asObservable();
  public totalSwap1M$ = this.totalSwap1M.asObservable();

  private midgardStatus = new BehaviorSubject<boolean>(null);
  private thornodeStatus = new BehaviorSubject<boolean>(null);
  public midgardStatus$ = this.midgardStatus.asObservable();
  public thornodeStatus$ = this.thornodeStatus.asObservable();

  private walletData = new BehaviorSubject<WalletData[]>(JSON.parse(localStorage.getItem('dcf-wallet-data')));
  public walletData$ = this.walletData.asObservable();
  private walletResume = new BehaviorSubject<number>(null);
  public walletResume$ = this.walletResume.asObservable();

  private walletLiquidity = new BehaviorSubject<WalletLiquidity>(null);
  public walletLiquidity$ = this.walletLiquidity.asObservable();

  private LPResume = new BehaviorSubject<Resume>(null);
  public LPResume$ = this.LPResume.asObservable();

  private NONLPResume = new BehaviorSubject<Resume>(null);
  public NONLPResume$ = this.NONLPResume.asObservable();

  private MCCNTrackingLiquidity = new BehaviorSubject<LiquidityTrack>(null);
  public MCCNTrackingLiquidity$ = this.MCCNTrackingLiquidity.asObservable();

  private endpointUrl = 'https://midgard.thorchain.info/v2/';
  //private endpointUrl = 'https://testnet.midgard.thorchain.info/v2/';

  public setMCCNTrackingLiquidity(MCCNTrackingLiquidity: LiquidityTrack){
    this.MCCNTrackingLiquidity.next(MCCNTrackingLiquidity);
  }

  public setLPResume(LPResume: Resume){
    this.LPResume.next(LPResume);
  }

  public setNONLPResume(NONLPResume: Resume){
    this.NONLPResume.next(NONLPResume);
  }

  public setWalleLiquidity(walletLiquidity: WalletLiquidity){
    this.walletLiquidity.next(walletLiquidity);
  }

  public setWalletData(walletData: WalletData[]){
    this.walletData.next(walletData);
  }

  public setTotalSwap24H(swap: number){
    this.totalSwap24H.next(swap);
  }
  public setTotalSwap1M(swap: number){
    this.totalSwap1M.next(swap);
  }

  public setTotalVolume24H(volume: number){
    this.totalVolume24H.next(volume);
  }
  public setTotalVolume1M(volume: number){
    this.totalVolume1M.next(volume);
  }

  public setMidgardStatus(status: boolean){
    this.midgardStatus.next(status);
  }
  public setThornodeStatus(status: boolean){
    this.thornodeStatus.next(status);
  }

  public setCurrency(currency: string){
    this.currency.next(currency);
  }

  private setOriginalPools(pools: Pool[]){
    this.originalPools.next(pools);
  }

  public getOriginalPools(){
    return this.originalPools.asObservable();
  }

  public setOriginalPriceChange(priceChange: DepthPriceHistory[]){
    this.originalPriceChange.next(priceChange);
  }

  public getOriginalPriceChange(){
    return this.originalPriceChange.asObservable();
  }


  public setOriginalStats24h(stats: PoolStats[]){
    this.originalStats24h.next(stats);
  }
  public setOriginalStats7d(stats: PoolStats[]){
    this.originalStats7d.next(stats);
  }
  public setOriginalStats30d(stats: PoolStats[]){
    this.originalStats30d.next(stats);
  }
  public setOriginalStats3m(stats: PoolStats[]){
    this.originalStats3m.next(stats);
  }
  public setOriginalStats1y(stats: PoolStats[]){
    this.originalStats1y.next(stats);
  }


  public getOriginalStats24h(){
    return this.originalStats24h.asObservable();
  }
  public getOriginalStats7d(){
    return this.originalStats7d.asObservable();
  }
  public getOriginalStats30d(){
    return this.originalStats30d.asObservable();
  }
  public getOriginalStats3m(){
    return this.originalStats3m.asObservable();
  }
  public getOriginalStats1y(){
    return this.originalStats1y.asObservable();
  }

  public getPools(asset: string): Observable<any>{
    return this.http.get(this.endpointUrl + 'pools/')
    .pipe(map((pools: Pool[]) => this.createPoolList(pools,asset)));
  }

  public getDepthPriceHistory(asset: string, interval: string, from: string, to: string): Observable<DepthPriceHistory>{

    const params = new HttpParams().set('interval', interval).set('from', from).set('to', to);

    return this.http.get<DepthPriceHistory>(`${this.endpointUrl}history/depths/${asset}`, {params});
  }

  public getAssetAPY(interval: string): Observable<HistoryField>{
    return this.http.get<HistoryField>(`${dfc_api}history/roi/asset/0/time/${interval}/network/multichain_chaosnet/`);
  }
  public getAssetPrice(interval: string): Observable<HistoryField>{
    return this.http.get<HistoryField>(`${dfc_api}history/price/asset/0/time/${interval}/network/multichain_chaosnet/`);
  }

  public getAssetMembers(interval: string): Observable<HistoryField>{
    return this.http.get<HistoryField>(`${dfc_api}history/stakers/asset/0/time/${interval}/network/multichain_chaosnet/`);
  }
  
  public getHeatlh(): Observable<Health>{
    return this.http.get<Health>(`${this.endpointUrl}health/`);
  }

  public getQueue(): Observable<Queue>{
    return this.http.get<Queue>(`${this.endpointUrl}thorchain/queue/`);
  }

  public getStats(): Observable<Stats>{
    return this.http.get<Stats>(`${this.endpointUrl}stats/`);
  }

  public getNetwork(): Observable<Network>{
    return this.http.get<Network>(`${this.endpointUrl}network/`);
  }

  public findBalance(wallet: WalletData, currency: string): Observable<any>{
    if(this.originalPools.value == null){
      this.getPools('USD').subscribe();
    }
    return this.http.get<WalletBalance[]>(`${dfc_api}balance/address/${wallet.address}/`)
    .pipe(map((balance: WalletBalance[]) => this.createBalance(wallet,balance,currency)));
  }

  createBalance(wallet: WalletData, balance: WalletBalance[], currency: string){
    let details = this.walletData.value;
    wallet.balance = balance;
    wallet.totalBalance = this.createResumeByWallet(wallet,currency);
    if(details == null){
      this.walletData.next([wallet]);
    }else{
      details.push(wallet);
      this.walletData.next(details);
    }

    this.createResume(currency);
  }

  createResumeByWallet(wallet: WalletData, currency: string): number{

    let BTCpool = this.originalPools.value.filter(pool => pool.asset == 'BTC.BTC');
    let runePriceUSD = +BTCpool[0].assetPriceUSD / +BTCpool[0].assetPrice;
    let resume = 0;

    if(wallet.chain == 'LTC'){
      let LTCpool = this.originalPools.value.filter(pool => pool.asset == 'LTC.LTC');
      resume = resume + (+LTCpool[0].assetPrice * wallet.balance[0].amount);
    }else if(wallet.chain == 'BTC'){
      resume = resume + (+BTCpool[0].assetPrice * wallet.balance[0].amount);
    }else if(wallet.chain == 'BCH'){
      let BCHpool = this.originalPools.value.filter(pool => pool.asset == 'BCH.BCH');
      resume = resume + (+BCHpool[0].assetPrice * (wallet.balance[0].amount / 100000000));
    }else if(wallet.chain == 'THOR'){
      resume = resume + (+wallet.balance[0].amount / 100000000);
    }else if(wallet.chain == 'ETH'){
      for (let x = 0; x < wallet.balance.length; x++) {
        if(wallet.balance[x].asset.includes('RUNE') == true){
          resume = resume + (+wallet.balance[x].amount / 1000000000000000000);
        }else{
          let ETHpool = this.originalPools.value.filter(pool => pool.asset.includes(wallet.balance[x].asset));
          let exponent = 1000000000000000000;
          if(wallet.balance[x].asset == 'ETH.USDT'){
            exponent = 1000000;
          }
          if(ETHpool.length > 0){
            resume = resume + (+ETHpool[0].assetPrice * (+wallet.balance[x].amount / exponent))
          }
        }
      }
    }else if(wallet.chain == 'BNB'){
      for (let x = 0; x < wallet.balance.length; x++) {
        if(wallet.balance[x].asset.includes('RUNE') == true){
          resume = resume + (+wallet.balance[x].amount);
        }else{
          let BNBpool = this.originalPools.value.filter(pool => pool.asset == 'BNB.' + wallet.balance[x].asset);
          if(BNBpool.length > 0){
            resume = resume + (+BNBpool[0].assetPrice * (+wallet.balance[x].amount))
          }
        }
      }
    }

    if(currency == 'USD'){
      resume = resume * runePriceUSD;
    }

    return resume;
  }

  createResume(currency: string){
    let details = this.walletData.value;
    let BTCpool = this.originalPools.value.filter(pool => pool.asset == 'BTC.BTC');
    let runePriceUSD = +BTCpool[0].assetPriceUSD / +BTCpool[0].assetPrice;
    let resume = 0;
    for (let i = 0; i < details.length; i++) {
      if(details[i].chain == 'LTC'){
        let LTCpool = this.originalPools.value.filter(pool => pool.asset == 'LTC.LTC');
        resume = resume + (+LTCpool[0].assetPrice * details[i].balance[0].amount);
        details[i].explorerURL = 'https://blockchair.com/litecoin/address/' + details[i].address;
      }else if(details[i].chain == 'BTC'){
        resume = resume + (+BTCpool[0].assetPrice * details[i].balance[0].amount);
        details[i].explorerURL = 'https://blockchair.com/bitcoin/address/' + details[i].address;
      }else if(details[i].chain == 'BCH'){
        let BCHpool = this.originalPools.value.filter(pool => pool.asset == 'BCH.BCH');
        resume = resume + (+BCHpool[0].assetPrice * (details[i].balance[0].amount / 100000000));
        details[i].explorerURL = 'https://www.blockchain.com/es/bch/address/' + details[i].address;
      }else if(details[i].chain == 'THOR'){
        resume = resume + (+details[i].balance[0].amount / 100000000);
        details[i].explorerURL = 'https://thorchain.net/#/address/' + details[i].address;
      }else if(details[i].chain == 'ETH'){
        for (let x = 0; x < details[i].balance.length; x++) {
          if(details[i].balance[x].asset.includes('RUNE') == true){
            resume = resume + (+details[i].balance[x].amount / 1000000000000000000);
          }else{
            let ETHpool = this.originalPools.value.filter(pool => pool.asset.includes(details[i].balance[x].asset));
            let exponent = 1000000000000000000;
            if(details[i].balance[x].asset == 'ETH.USDT'){
              exponent = 1000000;
            }
            if(ETHpool.length > 0){
              resume = resume + (+ETHpool[0].assetPrice * (+details[i].balance[x].amount / exponent))
            }
          }
        }
        details[i].explorerURL = 'https://etherscan.io/address/' + details[i].address;
      }else if(details[i].chain == 'BNB'){
        for (let x = 0; x < details[i].balance.length; x++) {
          if(details[i].balance[x].asset.includes('RUNE') == true){
            resume = resume + (+details[i].balance[x].amount);
          }else{
            let BNBpool = this.originalPools.value.filter(pool => pool.asset == 'BNB.' + details[i].balance[x].asset);
            if(BNBpool.length > 0){
              resume = resume + (+BNBpool[0].assetPrice * (+details[i].balance[x].amount))
            }
          }
        }

        details[i].explorerURL = 'https://explorer.binance.org/address/' + details[i].address;
      }
    }

    if(currency == 'USD'){
      resume = resume * runePriceUSD;
    }

    this.walletResume.next(resume);
  }

  public getPoolStats(asset: string, period: string): Observable<PoolStats>{
    return this.http.get<PoolStats>(`${this.endpointUrl}pool/${asset}/stats?period=${period}`);
  }

  public getStatsDeatil(asset: string, period: string, currency: string): Observable<any>{
    return this.http.get<PoolStats>(`${this.endpointUrl}pool/${asset}/stats?period=${period}`)
    .pipe(map((pool: PoolStats) => this.createDetailList(pool,currency)));
  }

  createDetailList(pool:PoolStats,currency: string): PoolDetail[]{

    let rank = 0;
    let asset = this.getAssetName(pool.asset);
    let runePriceBUSD = +pool.assetPriceUSD / +pool.assetPrice;
    if(currency == 'RUNE'){
      runePriceBUSD = 1;
    }
    let name = asset.ticker;
    let chain = asset.chain;
    let depth = this.calculateDepth(+pool.runeDepth, +pool.assetDepth, +pool.assetPriceUSD, runePriceBUSD, currency);
    let price = this.calculatePrice(currency,+pool.assetPriceUSD,+pool.assetPrice);
    let volume = this.calculateVolume(currency,+pool.swapVolume,runePriceBUSD);
    let perc = 0;
    let swaps = +pool.swapCount;
    let buys = +pool.toAssetVolume * runePriceBUSD;
    let sells = +pool.toRuneVolume * runePriceBUSD;
    let swapFee = +pool.averageSlip;
    let members = +pool.uniqueMemberCount;
    let apy = +pool.poolAPY;
    let swapSize = (volume / swaps) * runePriceBUSD;
    let isLoading = true;
    let status = pool.status;

    let graph = {
      grid: {
        height: 70,
        left: "0%",
        right: "0%",
        top: "0%"
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        show:false
      },
      yAxis: {
        type: 'value',
        min: 135,
        show:false
      },
      series: [{
        data: [150, 230, 224, 218, 135, 147, 260],
        type: 'line',
        smooth: true,
        symbol: "none",
        lineStyle: { 
          normal: {
            color: 'rgba(255, 149, 0, 1)',
          }, 
        },
        areaStyle:{ 
          normal: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 149, 0, 1)' },
              { offset: 0.7, color: 'rgba(255, 149, 0, 0.5)' },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' },
            ]),
          }, 
        }
      }]
    };
    

    let poolDetail:PoolDetail[] = [{
      rank: rank,
      name: name,
      asset: asset,
      chain: chain,
      price: price,
      depth: depth,
      volume: volume,
      perc: perc,
      weeklyChange: perc,
      swaps: swaps,
      buys: buys,
      sells: sells,
      swapFee: swapFee,
      members: members,
      apy: apy,
      swapSize: swapSize,
      graph: graph,
      status: status,
      isLoading: isLoading,
    }];


    return poolDetail;
  }

  createPoolList(pools: Pool[],currency: string): MarketPool[]{

    let orderedPools = this.orderTableByFieldDesc(pools,'runeDepth',currency);

    if(this.originalPools.value == null){
      this.setOriginalPools(pools);
    }

    let graph = {
      grid: {
        height: 70,
        left: "0%",
        right: "0%",
        top: "0%"
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        show:false
      },
      yAxis: {
        type: 'value',
        min: 135,
        show:false
      },
      series: [{
        data: [150, 230, 224, 218, 135, 147, 260],
        type: 'line',
        smooth: true,
        symbol: "none",
        lineStyle: { 
          normal: {
            color: 'rgba(255, 149, 0, 1)',
          }, 
        },
        areaStyle:{ 
          normal: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 149, 0, 1)' },
              { offset: 0.7, color: 'rgba(255, 149, 0, 0.5)' },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' },
            ]),
          }, 
        }
      }]
    };

    let poolList: MarketPool[] = [];

      for (const index in orderedPools) {
        let runePriceBUSD = +orderedPools[index].assetPriceUSD / +orderedPools[index].assetPrice;
        let asset = this.getAssetName(orderedPools[index].asset);

        let depth = this.calculateDepth(+orderedPools[index].runeDepth, +orderedPools[index].assetDepth, +orderedPools[index].assetPriceUSD, runePriceBUSD, currency);
        let price = this.calculatePrice(currency,+orderedPools[index].assetPriceUSD,+orderedPools[index].assetPrice);
        let volume = this.calculateVolume(currency,+orderedPools[index].volume24h,runePriceBUSD);
        let pool: MarketPool = {
          rank: +index + 1,
          name: asset.ticker,
          asset: asset,
          chain: asset.chain,
          price: price,
          depth: depth,
          volume: volume,
          perc: 0,
          weeklyChange: 0,
          graph: graph,
          status: orderedPools[index].status,
          isLoading: true
        };

        poolList.push(pool);
      }

      return poolList;

  }

  calculatePrice(currency,assetPriceUSD,assetPrice){
    let price = currency == 'RUNE' ? assetPrice : assetPriceUSD;
    return price;
  }

  calculateVolume(currency,volume24h,runePriceBUSD){
    let volume = currency == 'RUNE' ? volume24h : volume24h * runePriceBUSD;
    volume = isNaN(volume) ? 0 : volume;
    return volume;
  }

  calculateDepth(runeDepth,assetDepth,assetPrice,runePriceBUSD, currency): number{

    let depth = 0;
    if(currency == 'RUNE'){
      depth = runeDepth * 2;
    }else{
      depth = (runeDepth * runePriceBUSD) + (assetDepth * assetPrice);
    }

    depth = isNaN(depth) ? 0 : depth;

    return depth;

  }

  getAssetName(asset: string){

    let fullname: string;
    let chain: string;
    let symbol: string;
    let ticker: string;
    let iconPath: string;

    fullname = asset;
  
    const data = asset.split('.');
  
    if (asset.includes('.')) {
      chain = data[0];
      symbol = data[1];
    } else {
      symbol = data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }
  
    const trustWalletMatch = CoinIconsFromTrustWallet[ticker];

    if(chain == 'ETH' && ticker != 'ETH'){
      // Find token icons from ethereum network
      const ethMatch = EthIconsFromTrustWallet[ticker];  

      if(asset == 'ETH.ALCX-0XDBDB4D16EDA451D0503B854CF79D55697F90C8DF'){
        iconPath =  'https://etherscan.io/token/images/Alchemix_32.png';
      }else if(asset == 'ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C'){
        iconPath =  'https://etherscan.io/token/images/xrunetoken_32.png';
      }else{
        iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${ethMatch}/logo.png`;
      }
    }else{
      if (trustWalletMatch) {
        iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
      }else{
        // Override token icons when not found in trustwallet
        switch (asset){
          case 'BNB.BNB':
            iconPath =  'https://chaosnet.bepswap.com/static/media/coin-bnb.25324922.svg';
            break;
          case 'ETH.ETH':
            iconPath =  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/ETH-1C9/logo.png';
            break;
          case 'BTC.BTC':
            iconPath =  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
            break;
          default:
            console.warn(`Icon not available for poolName ${asset}. Add override in src\\app\\_classes\\asset.ts`);
            iconPath = 'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png';
            break;
        }
      }
    }
  
    return { fullname, chain, symbol, ticker, iconPath };
  }

  orderTableByFieldDesc(table, field: string, currency): any[]{
    return Array.from(table).sort((a: any, b: any) => {

      let aRunePriceBUSD = +a.assetPriceUSD / +a.assetPrice;
      let bRunePriceBUSD = +b.assetPriceUSD / +b.assetPrice;
      let aDepth = this.calculateDepth(+a.runeDepth, +a.assetDepth, +a.assetPriceUSD, aRunePriceBUSD, currency);
      let bDepth = this.calculateDepth(+b.runeDepth, +b.assetDepth, +b.assetPriceUSD, bRunePriceBUSD, currency);

      if ( aDepth > bDepth ){
       return -1;
     } else if ( aDepth < bDepth ){
       return 1;
     } else {
       return 0;
     }
    });
  }

  createWalletData(address:string): WalletData{
    let isBitcoin = this.bitcoinRegex.test(address);
    let isEthereum = this.ethereumRegex.test(address);
    let isBCH = bchRegex({exact: true}).test(address);
    let isLitecoin = this.litecoinRegex.test(address);
    let isBinance = this.binanceRegex.test(address);
    let isThorchain = this.thorchainRegex.test(address);
    let chain = '';
    let mask = this.getMask(address);
    let logo = '';

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
    }

    const wallet: WalletData = {type: 'manual', address: address, chain: chain, mask: mask, logo: logo};
    return wallet;

  }

  getMask(address: string){

    let addressLenght = address.length;
    let mask = address.slice(0,4)  + '....' + address.slice(addressLenght - 4, addressLenght);

    return mask;
    
  }


  /* SHOW HIDE AMOUNTS SELECTOR */
  setGlobalShowHide(value: boolean){
    this.globalShowHide.next(value);
  }

  /* NETWORK SELECTOR */
  setGlobalNetwork(network: string){
    this.globalNetwork.next(network);
  }

  getGlobalNetwork(): Observable<string>{
    return this.globalNetwork.asObservable();
  }

  /* MULTICHAIN LIQUIDITY */

  public getMCCNTrackingLiquidity(address: string, period: string): Observable<LiquidityTrack>{

    let body = {
      address: address
    }

    this.http.post(`${dfc_api}history/tracking_liquidity/address/${address}/`, body).subscribe(data => {
      console.log(data);
    });

    return this.http.get<LiquidityTrack>(`${dfc_api}history/tracking_liquidity/address/${address}/time/${period}`)
    .pipe(map((liquidity: LiquidityTrack) => this.processMCCNLiquidityTrack(liquidity)));
  }

  public processMCCNLiquidityTrack(liquidity: LiquidityTrack): LiquidityTrack{

    this.MCCNTrackingLiquidity.next(liquidity);

    return liquidity;
  }

  /* MULTICHAIN LIQUIDITY */

  public getMultichainLPData(address: string): Observable<WalletLiquidity>{

    if(address.length == 0){
      return;
    }

    return this.http.get(`${dfc_api}summary/liquidity/address/${address}/`)
    .pipe(map((liquidity: WalletLiquidity) => this.processMCCNData(liquidity)));
  }

  public processMCCNData(liquidity: WalletLiquidity): WalletLiquidity{

    for (const pool in liquidity.pools) {
      liquidity.pools[pool].pool_name = this.getAssetName(pool);
    }

    this.walletLiquidity.next(liquidity);

    return liquidity;
  }

  public getResumeMCCN(liquidity: WalletLiquidity, address: string,currency: string, showHideToggle: boolean){

    this.walletData$.subscribe(walletData => {
      if(walletData != null){

        let piePalette = ["rgba(178, 223, 138, 1)","rgba(31, 120, 180, 1)","rgba(51, 160, 44, 1)","rgba(166, 206, 227, 1)","rgba(118, 118, 118, 1)"];
        let pie: pieSerie[] = [];
        
        let totalField = currency.toLocaleLowerCase();
        if(totalField == 'asset'){
          totalField = 'usd';
        }
      
        let walletBalance = walletData.filter(wallet => wallet.address == address)[0].balance;
        let walletResumeValue = walletData.filter(wallet => wallet.address == address)[0].totalBalance;
      
        let totalWalletLP = 0;
        let pieAssets: pieSerie[] = [];
        for (const pool in liquidity.pools) {
          totalWalletLP = totalWalletLP + liquidity.pools[pool].current_liquidity.total[totalField];
        }
      
        totalWalletLP = totalWalletLP + walletResumeValue;
      
        for (const pool in liquidity.pools) {
        
          let assetPerc = (liquidity.pools[pool].current_liquidity.total[totalField] * 100) / totalWalletLP;
          let Amount = this.roundedPipe.transform(liquidity.pools[pool].current_liquidity.total[totalField]);
          showHideToggle == true ? Amount = Amount : Amount = '******';
          let poolName = this.getAssetName(pool);
          let pieAsset: pieSerie = {
            value: +assetPerc.toFixed(2),
            name: poolName.chain + '.' + poolName.ticker + ' (' + +assetPerc.toFixed(2) + '%) ' + Amount + this.getSimbol(currency,true),
            itemStyle: {color: ''}
          }
        
          pieAssets.push(pieAsset);

        }
      
        let assetOLPPerc = (walletResumeValue * 100) / totalWalletLP;
      
        let OLPAmount = this.roundedPipe.transform(walletResumeValue);
        showHideToggle == true ? OLPAmount = OLPAmount : OLPAmount = '******';
        let pieOLP: pieSerie = {
          value: +assetOLPPerc.toFixed(2),
          name: 'Assets Outside LP (' + assetOLPPerc.toFixed(2) + '%) ' + OLPAmount + this.getSimbol(currency,true),
          itemStyle: {color: ''}
        }
      
        pie = pieAssets;
        pie.push(pieOLP);
      
        for (let z = 0; z < pie.length; z++) {
          if(z < piePalette.length){
            pie[z].itemStyle.color = piePalette[z];
          }else{
            pie[z].itemStyle = {}
          }
        }
      
        let resume: Resume = {
          totalWallet: new BigNumber(totalWalletLP),
          totalLPPerc: new BigNumber(100).minus(assetOLPPerc),
          apy: liquidity.totals.apy[totalField].toFixed(2),
          apw: liquidity.totals.wpy[totalField].toFixed(2),
          apd: liquidity.totals.dpy[totalField].toFixed(2),
          pie: pie
        }
      
        this.LPResume.next(resume);
        
      }
    });
  }

  getNonLPResumeMCCN(currency: string, address: string, showHideToggle: boolean) {

    let resume: Resume;
    let piePalette = ["rgba(178, 223, 138, 1)","rgba(31, 120, 180, 1)","rgba(51, 160, 44, 1)","rgba(166, 206, 227, 1)","rgba(118, 118, 118, 1)"];   
  
    let pie: pieSerie[] = [];

    let wallet: WalletData;

    this.walletData$.subscribe(walletData =>{
      if(walletData != null){

        let totalWalletLP = new BigNumber(0);

        wallet = walletData.filter(wallet => wallet.address == address)[0];

        let NONLPDetails: NONLPDetail[] = [];
        let BTCpool = this.originalPools.value.filter(pool => pool.asset == 'BTC.BTC');
        let runePriceUSD = +BTCpool[0].assetPriceUSD / +BTCpool[0].assetPrice;
    
        if(wallet.chain == 'LTC'){
          let LTCpool = this.originalPools.value.filter(pool => pool.asset == 'LTC.LTC');
          let LTCpoolName = this.getAssetName(LTCpool[0].asset);
          NONLPDetails = [{chain: wallet.chain,asset: LTCpoolName,value: +LTCpool[0].assetPrice * wallet.balance[0].amount}];
        }else if(wallet.chain == 'BTC'){
          let BTCpoolName = this.getAssetName(BTCpool[0].asset);
          NONLPDetails = [{chain: wallet.chain,asset: BTCpoolName,value: +BTCpool[0].assetPrice * wallet.balance[0].amount}];
        }else if(wallet.chain == 'BCH'){
          let BCHpool = this.originalPools.value.filter(pool => pool.asset == 'BCH.BCH');
          let BCHpoolName = this.getAssetName(BCHpool[0].asset);
          NONLPDetails = [{chain: wallet.chain,asset: BCHpoolName,value: +BCHpool[0].assetPrice * wallet.balance[0].amount}];
        }else if(wallet.chain == 'THOR'){
          let THORpoolName: AssetName = {chain: 'THOR',fullname: 'THOR.RUNE',iconPath:'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',symbol:'RUNE',ticker:'RUNE'};
          NONLPDetails = [{chain: wallet.chain,asset: THORpoolName,value: +wallet.balance[0].amount / 100000000}];
        }else if(wallet.chain == 'ETH'){
          for (let x = 0; x < wallet.balance.length; x++) {
            if(wallet.balance[x].asset.includes('RUNE') == true){
              let THORpoolName: AssetName = {chain: 'ETH',fullname: 'ETH.RUNE',iconPath:'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',symbol:'RUNE',ticker:'RUNE'};
              NONLPDetails.push({chain: wallet.chain,asset: THORpoolName,value: +wallet.balance[x].amount / 1000000000000000000});
            }else{
              let ETHpool = this.originalPools.value.filter(pool => pool.asset.includes(wallet.balance[x].asset));
              let exponent = 1000000000000000000;
              if(wallet.balance[x].asset == 'ETH.USDT'){
                exponent = 1000000;
              }
              if(ETHpool.length > 0){
                let ETHpoolName = this.getAssetName(ETHpool[0].asset);
                NONLPDetails.push({chain: wallet.chain,asset: ETHpoolName,value: +ETHpool[0].assetPrice * (+wallet.balance[x].amount / exponent)});
              }
            }
          }
        }else if(wallet.chain == 'BNB'){
          for (let x = 0; x < wallet.balance.length; x++) {
            if(wallet.balance[x].asset.includes('RUNE') == true){
              let BNBpoolName: AssetName = {chain: 'BNB',fullname: 'BNB.RUNE',iconPath:'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',symbol:'RUNE',ticker:'RUNE'};
              NONLPDetails.push({chain: wallet.chain,asset: BNBpoolName,value: +wallet.balance[x].amount});
            }else{
              let BNBpool = this.originalPools.value.filter(pool => pool.asset == 'BNB.' + wallet.balance[x].asset);
              if(BNBpool.length > 0){
                let BNBpoolName = this.getAssetName(BNBpool[0].asset);
                NONLPDetails.push({chain: wallet.chain,asset: BNBpoolName,value: +BNBpool[0].assetPrice * (+wallet.balance[x].amount)});
              }
            }
          }
        }
    
        if(currency == 'USD'){
          for (let i = 0; i < NONLPDetails.length; i++) {
            
            NONLPDetails[i].value = NONLPDetails[i].value * runePriceUSD;
            
          }
        }

        for (let i = 0; i < NONLPDetails.length; i++) {
            
          totalWalletLP = totalWalletLP.plus(NONLPDetails[i].value);
          
        }

        let pieAssets: pieSerie[] = [];
        for (let x = 0; x < NONLPDetails.length; x++) {
          let assetPerc = (NONLPDetails[x].value * 100) / totalWalletLP.toNumber();
          let Amount = this.roundedPipe.transform(NONLPDetails[x].value);
          showHideToggle == true ? Amount = Amount : Amount = '******';
          let pieAsset: pieSerie = {
            value: +assetPerc.toFixed(2),
            name: NONLPDetails[x].chain + '.' + NONLPDetails[x].asset.ticker + ' (' + +assetPerc.toFixed(2) + '%) ' + Amount + this.getSimbol(currency,true),
            itemStyle: {color: ''}
          }

          pieAssets.push(pieAsset);

        }

        pie = pieAssets;

        for (let z = 0; z < pie.length; z++) {
          if(z < piePalette.length){
            pie[z].itemStyle.color = piePalette[z];
          }else{
            pie[z].itemStyle = {}
          }
        }
  
        resume = {
          totalWallet: totalWalletLP,
          totalLPPerc: new BigNumber(0),
          apy: 0,
          apw: 0,
          apd: 0,
          pie: pie
        }
    
        this.NONLPResume.next(resume);
      }
    });
  
    /*for (let i = 0; i < balance.length; i++) {
      if(currency == 'RUNE'){
        if(balance[i].asset == 'RUNE-B1A'){
          totalWalletLP = totalWalletLP.plus(balance[i].assetValue.amount());
          assetAmount.push({asset: balance[i].asset, amount: balance[i].assetValue.amount()});
        }else{
          let assetRuneAmount = this.getAssetRuneAmount(walletPrice,balance[i]);
          totalWalletLP = totalWalletLP.plus(assetRuneAmount);
          assetAmount.push({asset: balance[i].asset, amount: assetRuneAmount});
  
        }
      }else{
        if(balance[i].asset == 'RUNE-B1A'){
          let runeBalance = balance[i].assetValue.amount();
          totalWalletLP = totalWalletLP.plus(runeBalance.div(busdPrice));
          assetAmount.push({asset: balance[i].asset, amount: runeBalance.div(busdPrice)});
        }else{
          let assetRuneAmount = this.getAssetRuneAmount(walletPrice,balance[i]);
          totalWalletLP = totalWalletLP.plus(assetRuneAmount.div(busdPrice));
          assetAmount.push({asset: balance[i].asset, amount: assetRuneAmount.div(busdPrice)});
        }
      }
    }
  
    let pieAssets: pieSerie[] = [];
    for (let x = 0; x < assetAmount.length; x++) {
      let assetPerc = assetAmount[x].amount.multipliedBy(100).div(totalWalletLP);
      let Amount = this.roundedPipe.transform(assetAmount[x].amount.toNumber());
      let pieAsset: pieSerie = {
        value: +assetPerc.toFixed(2),
        name: this.getAssetName(assetAmount[x].asset) + ' (' + +assetPerc.toFixed(2) + '%) ' + Amount + this.getSimbol(currency,true),
        itemStyle: {color: ''}
      }
      
      pieAssets.push(pieAsset);
      
    }
  
    pie = pieAssets;
  
    for (let z = 0; z < pie.length; z++) {
      if(z < piePalette.length){
        pie[z].itemStyle.color = piePalette[z];
      }else{
        pie[z].itemStyle = {}
      }
    }*/

  }

  getSimbol(currency: string, flag: boolean){
    if (currency == 'RUNE'){
      return 'ᚱ';
    }else if(currency == 'BUSD'){
      return '$';
    }else{
      return flag == true ? '$' : '';
    }
  }


}
