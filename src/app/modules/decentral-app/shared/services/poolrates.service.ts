import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import {map} from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PoolRatesTable,PoolHistory,PoolRatesData, AssetPoints, Chart, PoolRates } from '../interfaces/poolrates';
import { CoinIconsFromTrustWallet, EthIconsFromTrustWallet } from 'src/app/modules/dex/shared/constants/icon-list';
import * as moment from 'moment';

@Injectable()
export class PoolratesService {

  private endpointUrl = environment.endpoint;
  private originalPoolRatesTable = new BehaviorSubject(null);
  private originalPoolRates = new BehaviorSubject(null);

  constructor(private http: HttpClient) { }

  private setOriginalPoolRatesTable(originalPoolRatesTable: PoolRatesTable[]){
    this.originalPoolRatesTable.next(originalPoolRatesTable);
  }

  public getOriginalPoolRatesTable(){
    return this.originalPoolRatesTable.asObservable();
  }

  public setOriginalPoolRatesModule(originalPoolRates: PoolRates){
    this.originalPoolRates.next(originalPoolRates);
  }

  public getOriginalPoolRatesModule(){
    return this.originalPoolRates.asObservable();
  }

  /**HISTORY */

  public getHistory(field: string, period: string, network: string, table: PoolRatesTable[]): Observable<any>{
    //return this.http.get(this.endpointUrl + 'history/' + field + '/asset/' + asset + '/time/' + period + '/');
    return this.http.get(this.endpointUrl + 'history/field/' + field + '/time/' + period + '/network/' + network + '/')
    .pipe(map((data: PoolHistory[]) => this.processHistoryData(data,table)));
  }

  processHistoryData(poolHistory: PoolHistory[],table: PoolRatesTable[]):Chart{

    let labels: string[] = [];
    let assetPoint: AssetPoints;
    let assetPoints: AssetPoints[] = [];
    let value: any;
    let chart: Chart;
    
    for (let i = 0; i < table.length; i++) {

      assetPoint = {
        asset: table[i].asset.nameChain,
        points: []
      };

      labels.push(table[i].asset.nameChain);
      
      let filtered = poolHistory.filter(pool => this.getAssetName(pool.asset.name).nameChain == table[i].asset.nameChain);

      for (let y = 0; y < filtered.length; y++) {

        if(filtered[y].field == 'roi'){
          value = [moment(filtered[y].time).format('MM/DD/YYYY HH:[00]'), (filtered[y].value * 100).toFixed(2)];
        }else if(filtered[y].field == 'stakers'){
          value = [moment(filtered[y].time).format('MM/DD/YYYY HH:[00]'),(filtered[y].value).toFixed(2)];
        }else{
          value = [moment(filtered[y].time).format('MM/DD/YYYY HH:[00]'),(filtered[y].value / 100000000).toFixed(2)];
        }
  
        assetPoint.points.push(value); 

      }

      assetPoints.push(assetPoint);
    }

    chart = {
      labels: labels,
      assetPoints: assetPoints,
      rawChart: poolHistory
    }

    return chart;
  }

  /** TOTALS */
  public getTotals(period: string, network: string){
    return this.http.get(this.endpointUrl + 'history/total/time/' + period + '/network/' + network + '/');
  }

  /** DATA TABLES BY ASSETS*/

  public getStakedTable(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/staked/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  public getStakersTable(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/stakers/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  public getRoiTable(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/roi/asset/' + asset + '/time/' + period + '/');
  }

  /* Endpoint to find asset's Depth */
  public getDepthTable(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/depth/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  /** DATA CHART POINTS BY FIELD*/

  public getStakedChart(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/staked/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  public getStakersChart(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/stakers/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  public getRoiChart(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/roi/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  public getPriceChart(period: string, network: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/price/asset/' + asset + '/time/' + period + '/network/' + network + '/');
  }

  /** Service to get PoolRates Data Table */
  public getPoolratesTable(period: string, network: string, asset: number){
    //return this.http.get(this.endpointUrl + 'poolrates/asset/' + asset + '/time/' + period + '/');
    return this.http.get(this.endpointUrl + 'history/total/pools/time/' + period + '/network/' + network + '/')
    .pipe(map((data: PoolRatesData[]) => this.processPoolratesTable(data,network)));
  }

  processPoolratesTable(poolRatesData: PoolRatesData[],network: string):PoolRatesTable[]{

    let poolratesTable: PoolRatesTable[] = [];
    let enableStatus = 'enabled';
    let filtered = poolRatesData.filter(pool => pool.asset.status == enableStatus);
    if(network == 'multichain_chaosnet'){
      enableStatus = 'available';
      filtered = poolRatesData.filter(pool => pool.asset.status == enableStatus);
    }

    for (let i = 0; i < filtered.length; i++) {

      if(filtered[i].asset.status == enableStatus){

        let poolrate:PoolRatesTable = {
          asset: this.getAssetName(filtered[i].asset.name),
          price: filtered[i].price,
          depth: filtered[i].depth,
          volume: filtered[i].volume,
          swaps: filtered[i].swaps,
          roi: filtered[i].roi,
          stakers: filtered[i].stakers,
          staked: filtered[i].staked,
          slip: filtered[i].slipaverage,
        };

        poolratesTable.push(poolrate);
      }
    }

    let orderedPoolratesTable = this.orderTableByROIDesc(poolratesTable);
    this.setOriginalPoolRatesTable(orderedPoolratesTable);

    return orderedPoolratesTable;

  }
  
  orderTableByROIDesc(poolratesTable: PoolRatesTable[]){
    return Array.from(poolratesTable).sort((a: any, b: any) => {
      if ( a['roi'] > b['roi'] ){
       return -1;
     } else if ( a['roi'] < b['roi'] ){
       return 1;
     } else {
       return 0;
     }
    });
  }

  getAssetName(asset: string){

    let fullname: string;
    let chain: string;
    let nameChain: string;
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

    nameChain = chain + '.' + ticker;
  
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
  
    return { fullname, nameChain, chain, symbol, ticker, iconPath };
  }

}
