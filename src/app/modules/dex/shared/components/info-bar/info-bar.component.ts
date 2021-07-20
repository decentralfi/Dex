import { Component, OnInit } from '@angular/core';
import { Pool, MarketPool, PoolStats } from '../../interfaces/marketcap';

/* Master Wallet Manager */
import { MasterWalletManagerService } from '../../../../../services/master-wallet-manager.service';

@Component({
  selector: 'dcf-info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.scss']
})
export class InfoBarComponent implements OnInit {

  public innerWidth: any;
  public topBar: string = 'top-bar open';
  public currencyName:string = 'USD';

  public totalDepth: number;
  public activePools: number;
  public activeNodes: number;
  public avgBond: number;
  public runePrice: number;
  public avgGasPrice: number;
  public txnQueue: number;
  public blocksToChurn: number;
  public totalVolume24H: number;
  public totalVolume7D: number;
  public totalVolume1M: number;

  public totalSwap24H: number;
  public totalSwap7D: number;
  public totalSwap1M: number;

  constructor(
    private marketcapService: MasterWalletManagerService,
  ) { }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
    if(this.innerWidth > 960){
    }else if(this.innerWidth > 450 && this.innerWidth <= 960){
      this.topBar = 'top-bar open';
    }else if(this.innerWidth <= 450){
      this.topBar = 'top-bar open';
    }

    this.marketcapService.currency$.subscribe(currency => {
      if(currency != null){
        this.currencyName = currency;
        this.marketcapService.originalPools$.subscribe((pools: Pool[]) => {
          if(pools != null){
            let marketPools = this.marketcapService.createPoolList(pools,this.currencyName);
            let activePoolsList = marketPools.filter(pool => pool.status == 'available');   
            this.activePools = activePoolsList.length;   

            let totalDepth = 0;
            let totalVolume24H = 0;
            for (let i = 0; i < activePoolsList.length; i++) {
              totalDepth = totalDepth + activePoolsList[i].depth;
              totalVolume24H = totalVolume24H + activePoolsList[i].volume;   
            }
          
            this.totalDepth = totalDepth / 100000000;
            this.totalVolume24H = totalVolume24H / 100000000;
          
            this.getStats(marketPools);
          }else{
            this.getPools();
          }
        });
      }
    });

    this.getTopBarData();
  }

  getTopBarData(){

    this.marketcapService.getQueue().subscribe(queue => {
      this.txnQueue = queue.outbound;
    });

    this.marketcapService.getStats().subscribe(stats => {
      this.runePrice = +stats.runePriceUSD;
    });

    this.marketcapService.getNetwork().subscribe(network => {
      this.activeNodes = +network.activeNodeCount;
      this.avgBond = +network.bondMetrics.averageActiveBond / 100000000;
      
      this.marketcapService.getHeatlh().subscribe(health => {
        this.blocksToChurn = +network.nextChurnHeight - +health.scannerHeight;
        this.marketcapService.setMidgardStatus(health.inSync);
        this.marketcapService.setThornodeStatus(health.database);
      });
    });

  }

  getPools(){
    this.marketcapService.getPools(this.currencyName).subscribe((poolList: MarketPool[]) => {

      let activePoolsList = poolList.filter(pool => pool.status == 'available');   
      this.activePools = activePoolsList.length;   
      
      let totalDepth = 0;
      let totalVolume24H = 0;
      for (let i = 0; i < activePoolsList.length; i++) {
        totalDepth = totalDepth + activePoolsList[i].depth;
        totalVolume24H = totalVolume24H + activePoolsList[i].volume;   
      }

      this.totalDepth = totalDepth / 100000000;
      this.totalVolume24H = totalVolume24H / 100000000;

      this.getStats(poolList);
      
    });
  }

  getStats(poolList: MarketPool[]){
    this.marketcapService.getOriginalStats24h().subscribe(stats => {
      if(stats != null){

        let volume24h = 0;
        let volume7d = 0;
        let volume30d = 0;

        let swaps24h = 0;
        let swaps30d = 0;

        let activePools = stats.filter(pool => pool.status == 'available');

        for (let i = 0; i < activePools.length; i++) {
          if(activePools[i].period == '24h'){
            volume24h = volume24h + +activePools[i].swapVolume;
            swaps24h = swaps24h + +activePools[i].swapCount;
          }else if(activePools[i].period == '7d'){
            volume7d = volume7d + +activePools[i].swapVolume;
          }else if(activePools[i].period == '30d'){
            volume30d = volume30d + +activePools[i].swapVolume;
            swaps30d = swaps30d + +activePools[i].swapCount;
          }
        }

        if(this.currencyName == 'RUNE'){
          this.totalVolume7D = volume7d / 100000000;
          this.totalVolume1M = volume30d / 100000000;
        }else{
          this.totalVolume7D = (volume7d / 100000000) * this.runePrice;
          this.totalVolume1M = (volume30d / 100000000) * this.runePrice;
        }

        this.marketcapService.setTotalSwap24H(swaps24h);
        this.marketcapService.setTotalSwap1M(swaps30d);

        this.marketcapService.setTotalVolume1M(this.totalVolume1M);

      }else{

        let stats24h:PoolStats[] = [];
        let periods = ['24h', '7d', '30d'];
        for (let i = 0; i < poolList.length; i++) {
          for (let y = 0; y < periods.length; y++) {
            this.marketcapService.getPoolStats(poolList[i].asset.fullname,periods[y]).subscribe(poolStats => {

              if(poolStats.asset == poolList[i].asset.fullname){
                poolStats.period = periods[y];
                stats24h.push(poolStats);
                this.marketcapService.setOriginalStats24h(stats24h);
              }
    
            },error =>{
              if(error.message && error.message.includes('Http failure response') == true){
                
                //second attempt
                this.marketcapService.getPoolStats(poolList[i].asset.fullname,periods[y]).subscribe(poolStats => {

                  if(poolStats.asset == poolList[i].asset.fullname){
                    poolStats.period = periods[y];
                    stats24h.push(poolStats);
                    this.marketcapService.setOriginalStats24h(stats24h);
                  }
        
                });

              }if(error.error && error.message.includes('Unknown pool') == true){
                console.log('This Pool does not exist or is not loger available');
              }

            }); 
          }
        } 

      }
    });
  }

  setTopBarClass(){
    if(this.topBar == 'top-bar closed'){
      this.topBar = 'top-bar open';
    }else if(this.topBar == 'top-bar open'){
      this.topBar = 'top-bar closed';
    }
  }

  getSimbol(title?: boolean){
    if (this.currencyName == 'RUNE'){
      return 'ᚱ';
    }else{
      return '$';
    }
  }

}
