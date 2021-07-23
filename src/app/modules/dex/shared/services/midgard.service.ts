import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PoolDetail } from '../classes/pool-detail';
import { TransactionDTO, Transaction } from '../classes/transaction';
import { PoolAddressesDTO } from '../classes/pool-address';
import { StakerDTO } from '../classes/staker';
import { StakerPoolDataDTO } from '../classes/staker-pool-data';
import { MidgardConstants } from '../interfaces/midgard-constants';
import {AssetDetail} from '../interfaces/models/assetDetail';
import {StakerHistoryPool} from '../interfaces/models/StakerHistoryPool';
import {PoolStakeAmount, StakePoolSummary} from '../interfaces/models/staker-pool/StakePoolSummary';
import BigNumber from 'bignumber.js';
import * as moment from 'moment';
import {map} from 'rxjs/operators';

@Injectable()
export class MidgardService {

  private basePath: string;

  private summaryBUSDAmount = new BehaviorSubject<StakePoolSummary>(null);
  summaryBUSDAmount$ = this.summaryBUSDAmount.asObservable();

  constructor(private http: HttpClient) { 
    this.basePath = (environment.network === 'testnet')
      ? 'https://midgard.bepswap.com/v1'
      : 'https://chaosnet-midgard.bepswap.com/v1';

  }

  setWalletBalance(BUSDAmount){
    this.summaryBUSDAmount.next(BUSDAmount);
  }

  getPools(): Observable<string[]> {
    return this.http.get<string[]>(`${this.basePath}/pools`);
  }

  getPoolDetails(assets: string[], view: 'balances' | 'simple' | 'full'): Observable<PoolDetail[]> {

    const params = new HttpParams().set('asset', assets.join(',')).set('view', view);

    return this.http.get<PoolDetail[]>(`${this.basePath}/pools/detail`, {params});
  }

  getConstants(): Observable<MidgardConstants> {
    return this.http.get<MidgardConstants>(`${this.basePath}/thorchain/constants`);
  }

  getProxiedPoolAddresses(): Observable<PoolAddressesDTO> {
    return this.http.get<PoolAddressesDTO>(`${this.basePath}/thorchain/pool_addresses`);
  }

  getTransaction(txId: string): Observable<TransactionDTO> {

    const params = new HttpParams().set('offset', '0').set('limit', '1').set('txid', txId);

    return this.http.get<TransactionDTO>(`${this.basePath}/txs`, {params});
  }
  
  getPoolTxsByWallet(address: string,asset: string, type: string): Observable<TransactionDTO> {

    const params = new HttpParams().set('address',address).set('type', type).set('offset', '0').set('limit', '50').set('asset', asset);

    return this.http.get<TransactionDTO>(`${this.basePath}/txs`, {params});
  }

  getOgirinalStake(address: string, asset: string): Observable<any> {
    return this.getPoolTxsByWallet(address,asset,'stake,unstake')
    .pipe(map((value: TransactionDTO) => this.createSummaryPool(value,asset)));
  }

  createSummaryPool(PoolTxs: TransactionDTO, asset: string): StakePoolSummary {

    let units: number = 0;
    const txs = PoolTxs.txs.reverse();
    
    let historyPool: StakerHistoryPool = {
      pool: '',
      runestake: '0',
      assetstake: '0',
      poolunits: '0',
      assetwithdrawn: '0',
      runewithdrawn: '0',
      totalstakedasset: '0',
      totalstakedrune: '0',
      totalstakedusd: '0',
      totalunstakedasset: '0',
      totalunstakedrune: '0',
      totalunstakedusd: '0',
      firststake: 0,
      laststake: 0
    };

    for (let i = 0; i < txs.length; i++) {
      
      let coin;
      let rune;

      if(units == 0){historyPool.firststake = txs[i].date;}
      
      units = units + +txs[i].events.stakeUnits;
      historyPool.poolunits = units.toString();
    
      historyPool.pool = asset;
      if(txs[i].type == 'stake'){
        coin = txs[i].in.coins.filter(coin => coin.asset == asset);
        rune = txs[i].in.coins.filter(coin => coin.asset == 'BNB.RUNE-B1A');
        historyPool.assetstake = coin.length > 0 ? (+historyPool.assetstake + +coin[0].amount).toString() : '0';
        historyPool.runestake = rune.length > 0 ? (+historyPool.runestake + +rune[0].amount).toString() : '0';
        historyPool.laststake = txs[i].date;
        
      }else if (txs[i].type == 'unstake'){
        if(units == 0){
          historyPool.assetstake = '0';
          historyPool.runestake = '0';
          historyPool.assetwithdrawn = '0';
          historyPool.runewithdrawn = '0';
        }else{
          coin = txs[i].out.filter(outs => outs.coins[0].asset == asset);
          rune = txs[i].out.filter(outs => outs.coins[0].asset == 'BNB.RUNE-B1A');

          let coinValue = coin.length == 0 ? '0' : coin[0].coins[0].amount;
          let runeValue = rune.length == 0 ? '0' : rune[0].coins[0].amount;

          historyPool.assetwithdrawn = (+historyPool.assetwithdrawn + +coinValue).toString();
          historyPool.runewithdrawn = (+historyPool.runewithdrawn + +runeValue).toString();
          historyPool.assetstake = (+historyPool.assetstake - +coinValue).toString();
          historyPool.runestake = (+historyPool.runestake - +runeValue).toString();
        }
      }
      
    }
    historyPool.totalstakedasset = (+historyPool.assetstake * 2).toString();
    historyPool.totalstakedrune = (+historyPool.runestake * 2).toString();
    historyPool.totalunstakedasset = (+historyPool.assetwithdrawn * 2).toString();
    historyPool.totalunstakedrune = (+historyPool.runewithdrawn * 2).toString();


    const txHis: StakerHistoryPool = historyPool;
    const stake: PoolStakeAmount = {
        asset: txHis.pool,
        assetAmount: new BigNumber(txHis.assetstake),
        targetAmount: new BigNumber(txHis.runestake),
        totalAssetAmount: new BigNumber(txHis.totalstakedasset),
        totalTargetAmount: new BigNumber(txHis.totalstakedrune),
        totalBUSDAmount: new BigNumber(txHis.totalstakedusd),
        newtotalBUSDAmount: +txHis.totalstakedusd,
        unit: new BigNumber(txHis.poolunits),
    };

    const unStake: PoolStakeAmount = {
        asset: txHis.pool,
        assetAmount: new BigNumber(txHis.assetwithdrawn),
        targetAmount: new BigNumber(txHis.runewithdrawn),
        totalAssetAmount: new BigNumber(txHis.totalunstakedasset),
        totalTargetAmount: new BigNumber(txHis.totalunstakedrune),
        totalBUSDAmount: new BigNumber(txHis.totalunstakedusd),
        newtotalBUSDAmount: +txHis.totalunstakedusd,
        unit: new BigNumber(txHis.poolunits),
    };

    let summary: StakePoolSummary = {
        asset: txHis.pool,
        stake,
        withdraw: unStake,
        time: `${txHis.firststake}`
    };

    this.getOriginalDataWUSD(txs,asset);

    return summary;
  }

  getOriginalDataWUSD(txs: Transaction[], asset: string){
    let units = 0;
    //let stakeAmount: number = 0;
    let arrayCopy = [];
    let isComplete: boolean;

    let u = 0;

    for (let y = 0; y < txs.length; y++) {

      let rune;
      let coin;
      let amount;

      
      let date = txs[y].date;
      let datePlus = moment(txs[y].date * 1000).add(5,'minutes').format('X');

      if(txs[y].type == 'stake'){
        rune = txs[y].in.coins.filter(coin => coin.asset == 'BNB.RUNE-B1A');
        coin = txs[y].in.coins.filter(coin => coin.asset == asset);
        // when is symmetric stake
        if(rune.length > 0 && coin.length > 0){

          this.getHistoricPrice('BNB.BUSD-BD1',date.toString(), datePlus).subscribe(res =>{

            units = +txs[y].events.stakeUnits;
            let busdtotal = 0;
            if(res.length != 0){
              busdtotal = ((1 / +res[0].price)*rune[0].amount)*2;
            }
            
            let ob = {asset: asset, runestake: rune[0].amount, assetstake: coin[0].amount,runetotal: rune[0].amount*2,assettotal: coin[0].amount*2, busdtotal: busdtotal, units: units, type: 'stake', date: date};
            arrayCopy[y] = ob;

            isComplete = this.validateArrayCopy(arrayCopy,txs.length);
            if(isComplete){this.processArrayCopy(arrayCopy);}
      
          },error => { console.log(error)});
        // when is only asset stake
        }else if (rune.length == 0 && coin.length > 0){
          const busdp = this.getHistoricPrice('BNB.BUSD-BD1',date.toString(), datePlus);
          const assetp = this.getHistoricPrice(asset,date.toString(), datePlus);
          forkJoin([busdp,assetp]).subscribe((result) => {

            let busdPrice = result[0][0].price;
            let assetPrice = result[1][0].price;
            let runePrice = 1 / busdPrice;
            let assetBusdPrice = assetPrice * runePrice;
            
            let runetotal = 0;
            let busdtotal = 0;
            runetotal = +assetPrice*+coin[0].amount;
            busdtotal = (assetBusdPrice*+coin[0].amount);
            units = +txs[y].events.stakeUnits;
            let ob = {asset: asset, runestake: 0, assetstake: coin[0].amount,runetotal: runetotal, assettotal: coin[0].amount, busdtotal: busdtotal, units: units, type: 'stake', date: date};
            arrayCopy[y] = ob;

            isComplete = this.validateArrayCopy(arrayCopy,txs.length);
            if(isComplete){this.processArrayCopy(arrayCopy);}

          },error => { console.log(error)});
        // when is only rune stake
        }else if (rune.length > 0 && coin.length == 0){
          const busdp = this.getHistoricPrice('BNB.BUSD-BD1',date.toString(), datePlus);
          const assetp = this.getHistoricPrice(asset,date.toString(), datePlus);
          forkJoin([busdp,assetp]).subscribe((result) => {

            let busdPrice = result[0][0].price;
            let assetPrice = result[1].length == 0 ? '0' : result[1][0].price;
            let runePrice = 1 / busdPrice;
            let assetBusdPrice = assetPrice * runePrice;
            
            
            units = +txs[y].events.stakeUnits;
            let ob = {asset: asset, runestake: rune[0].amount, assetstake: 0,runetotal: rune[0].amount, assettotal: ((rune[0].amount/assetPrice)), busdtotal: (runePrice*(rune[0].amount)), units: units, type: 'stake', date: date};
            arrayCopy[y] = ob;

            isComplete = this.validateArrayCopy(arrayCopy,txs.length);
            if(isComplete){this.processArrayCopy(arrayCopy);}

          },error => { console.log(error)});

        }

      }else if (txs[y].type == 'unstake'){
        this.getHistoricPrice('BNB.BUSD-BD1',date.toString(), datePlus).subscribe(res =>{
          units = +txs[y].events.stakeUnits;
          rune = txs[y].out.filter(outs => outs.coins[0].asset == 'BNB.RUNE-B1A');
          coin = txs[y].out.filter(outs => outs.coins[0].asset == asset);

          let coinValue = coin.length == 0 ? '0' : coin[0].coins[0].amount;
          let runeValue = rune.length == 0 ? '0' : rune[0].coins[0].amount;

          let ob = {asset: asset, runestake: runeValue, assetstake: coinValue,runetotal: (+runeValue)*2, assettotal: (+coinValue)*2, busdtotal: ((1 / +res[0].price)*(+runeValue))*2, units: units, type: 'unstake', date: date};
          arrayCopy[y] = ob;

          isComplete = this.validateArrayCopy(arrayCopy,txs.length);
          if(isComplete){this.processArrayCopy(arrayCopy);}
        },error => { console.log(error)});

      }

    }
  }

  validateArrayCopy(arrayCopy: any[], txsLength: number): boolean{
    let counter = 0;
    for (let i = 0; i < arrayCopy.length; i++) {
      if(arrayCopy[i]){
        counter ++;
      }
      
    }

    if (counter == txsLength){
      return true;
    }else{
      return false;
    }
  }

  processArrayCopy(arrayCopy: any[]){

    let units: number = 0;

    let historyPool: StakerHistoryPool = {
      pool: '',
      runestake: '0',
      assetstake: '0',
      poolunits: '0',
      assetwithdrawn: '0',
      runewithdrawn: '0',
      totalstakedasset: '0',
      totalstakedrune: '0',
      totalstakedusd: '0',
      totalunstakedasset: '0',
      totalunstakedrune: '0',
      totalunstakedusd: '0',
      firststake: 0,
      laststake: 0
    };

    //console.log(arrayCopy);

    for (let i = 0; i < arrayCopy.length; i++) {

      if(units == 0){historyPool.firststake = arrayCopy[i].date;}
      
      units = units + +arrayCopy[i].units;
      historyPool.poolunits = units.toString();
    
      historyPool.pool = arrayCopy[i].asset;
      if(arrayCopy[i].type == 'stake'){

        historyPool.assetstake = (+historyPool.assetstake + +arrayCopy[i].assetstake).toString();
        historyPool.runestake = (+historyPool.runestake + +arrayCopy[i].runestake).toString();
        historyPool.totalstakedusd = (+historyPool.totalstakedusd + +arrayCopy[i].busdtotal).toString();

        historyPool.totalstakedrune = (+historyPool.totalstakedrune + +arrayCopy[i].runetotal).toString();
        historyPool.totalstakedasset = (+historyPool.totalstakedasset + +arrayCopy[i].assettotal).toString();
        historyPool.laststake = arrayCopy[i].date;
        
      }else if (arrayCopy[i].type == 'unstake'){
        if(units == 0){
          historyPool.assetstake = '0';
          historyPool.runestake = '0';
          historyPool.assetwithdrawn = '0';
          historyPool.runewithdrawn = '0';
          historyPool.totalstakedasset = '0';
          historyPool.totalstakedrune = '0';
          historyPool.totalstakedusd = '0';
          historyPool.totalunstakedasset = '0';
          historyPool.totalunstakedrune = '0';
          historyPool.totalunstakedusd = '0';
        }else{
          historyPool.assetwithdrawn = (+historyPool.assetwithdrawn + +arrayCopy[i].assetstake).toString();
          historyPool.runewithdrawn = (+historyPool.runewithdrawn + +arrayCopy[i].runestake).toString();
          //historyPool.assetstake = (+historyPool.assetstake - +arrayCopy[i].assetstake).toString();
          //historyPool.runestake = (+historyPool.runestake - +arrayCopy[i].runestake).toString();

          historyPool.totalunstakedusd = (+historyPool.totalunstakedusd + +arrayCopy[i].busdtotal).toString();
          //historyPool.totalstakedusd = (+historyPool.totalstakedusd - +arrayCopy[i].busdtotal).toString();
        }
      }

      //console.log(arrayCopy[i].type);
      //console.log(arrayCopy[i].runetotal);
      
    }
    //console.log(historyPool.runestake);
    if(+historyPool.runestake != 0 && +historyPool.assetstake == 0){
      historyPool.totalstakedrune = historyPool.runestake;
    }else if(+historyPool.runestake != 0 && +historyPool.assetstake == 0){
      historyPool.totalstakedasset = historyPool.assetstake;
    }else if (+historyPool.runestake != 0 && +historyPool.assetstake != 0){
      historyPool.totalstakedrune = (+historyPool.runestake * 2).toString();
      historyPool.totalstakedasset = (+historyPool.assetstake * 2).toString();
    }

    historyPool.totalunstakedasset = (+historyPool.assetwithdrawn * 2).toString();
    historyPool.totalunstakedrune = (+historyPool.runewithdrawn * 2).toString();

    /*historyPool.totalstakedusd = (+historyPool.totalstakedusd * 100000000).toString();
    if(historyPool.pool == 'BNB.BTCB-1DE'){
      console.log(historyPool.totalstakedusd);
    }*/
    //historyPool.totalstakedusd = (+historyPool.totalstakedusd).toString();

    const txHis: StakerHistoryPool = historyPool;
    const stake: PoolStakeAmount = {
        asset: txHis.pool,
        assetAmount: new BigNumber(txHis.assetstake),
        targetAmount: new BigNumber(txHis.runestake),
        totalAssetAmount: new BigNumber(txHis.totalstakedasset),
        totalTargetAmount: new BigNumber(txHis.totalstakedrune),
        totalBUSDAmount: new BigNumber(txHis.totalstakedusd),
        newtotalBUSDAmount: +txHis.totalstakedusd,
        unit: new BigNumber(txHis.poolunits),
    };

    const unStake: PoolStakeAmount = {
        asset: txHis.pool,
        assetAmount: new BigNumber(txHis.assetwithdrawn),
        targetAmount: new BigNumber(txHis.runewithdrawn),
        totalAssetAmount: new BigNumber(txHis.totalunstakedasset),
        totalTargetAmount: new BigNumber(txHis.totalunstakedrune),
        totalBUSDAmount: new BigNumber(txHis.totalunstakedusd),
        newtotalBUSDAmount: +txHis.totalunstakedusd,
        unit: new BigNumber(txHis.poolunits),
    };

    let summary: StakePoolSummary = {
        asset: txHis.pool,
        stake,
        withdraw: unStake,
        time: `${txHis.firststake}`
    };

    console.log('paso1.85',summary);

    this.summaryBUSDAmount.next(summary);

  }

  getHistoricPrice(asset: string, from: string, to: string): Observable<any> {
    ///v1/history/pools?pool=BNB.BUSD-BD1&interval=5min&from=1603808028&to=1603808328
    const params = new HttpParams().set('pool', asset).set('interval', '5min').set('from', from).set('to', to);
    return this.http.get(`${this.basePath}/history/pools`, {params});
  }

  getStaker(address: string): Observable<StakerDTO> {
    return this.http.get<StakerDTO>(`${this.basePath}/stakers/${address}`);
  }

  getStakerPoolData(accountId: string, assets: string[]): Observable<StakerPoolDataDTO[]> {

    const params = new HttpParams().set('asset', assets.join(','));

    return this.http.get<StakerPoolDataDTO[]>(`${this.basePath}/stakers/${accountId}/pools`, {params});
  }

  getBUSDPrice(): Observable<AssetDetail[]>{
    const pool = ['BNB.BUSD-BD1'];
    const params = new HttpParams()
        .set('asset', pool.join(','));
    return  this.http.get<AssetDetail[]>(`${this.basePath}/assets`, {params});
  }

  getAssetPrice(assets: string[]): Observable<AssetDetail[]>{
    const pool = assets;
    const params = new HttpParams()
        .set('asset', pool.join(','));
    return  this.http.get<AssetDetail[]>(`${this.basePath}/assets`, {params});
  }

  getSingleAssetPrice(asset: string): Observable<AssetDetail>{
    const pool = asset;
    const params = new HttpParams()
        .set('asset', pool);
    return  this.http.get<AssetDetail>(`${this.basePath}/assets`, {params});
  }

}
