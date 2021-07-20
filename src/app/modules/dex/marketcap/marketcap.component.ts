import { Component, OnInit, HostBinding, HostListener, ViewChild } from '@angular/core';
import {Router} from '@angular/router';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { environment } from 'src/environments/environment';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { Pool, MarketPool, DepthPriceHistory } from '../shared/interfaces/marketcap';
import * as moment from 'moment';
import { graphic } from 'echarts';

/* Master Wallet Manager */
import { MasterWalletManagerService } from '../../../services/master-wallet-manager.service';

@Component({
  selector: 'app-marketcap',
  templateUrl: './marketcap.component.html',
  styleUrls: ['./marketcap.component.scss']
})
export class MarketcapComponent implements OnInit {

  public innerWidth: any;

  @HostBinding('class') componentCssClass: any;

  @HostListener('window:resize', ['$event']) onResize(event) {
    this.innerWidth = window.innerWidth;
    if(this.innerWidth > 960){
    }else if(this.innerWidth > 450 && this.innerWidth <= 960){
      this.topBar = 'top-bar open';
    }else if(this.innerWidth <= 450){
      this.topBar = 'top-bar open';
    }

  }

  public showHideToggle: boolean = true;

  public poolList: MarketPool[] = [];

  public displayedColumns: string[] = ['rank', 'name', 'chain', 'price', 'depth', 'volume', 'perc', 'weeklyChange', 'graph', 'status', 'operation'];
  public dataSource = new MatTableDataSource<MarketPool>(this.poolList);

  public themeValue = '';
  public columDark: boolean;
  public currencyValue:string = 'USD';
  public currencyName:string = 'USD';

  public binanceExplorerUrl: string;
  public poolRatesTablePageSize: any = 100;
  public isLoading = true;
  //public poolList: MarketPool[] = [];
  public sortedData: MarketPool[];

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

  public resume: number;

  public topBar: string = 'top-bar open';

  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  
  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private router: Router,
    private masterWalletManagerService: MasterWalletManagerService,
  ) { 
    this.binanceExplorerUrl = environment.network === 'testnet'
    ? 'https://testnet-explorer.binance.org/'
    : 'https://explorer.binance.org/';

    this.componentCssClass = 'full';

    this.sortedData = this.poolList.slice();
  }

  ngOnInit() {

    this.innerWidth = window.innerWidth;
    if(this.innerWidth > 960){
    }else if(this.innerWidth > 450 && this.innerWidth <= 960){
      this.topBar = 'top-bar open';
    }else if(this.innerWidth <= 450){
      this.topBar = 'top-bar open';
    }

    this.masterWalletManagerService.currency$.subscribe(currency => {
      if(currency != null){

        this.currencyName = currency;
        this.masterWalletManagerService.originalPools$.subscribe((pools: Pool[]) => {
          if(pools != null){
            let marketPools = this.masterWalletManagerService.createPoolList(pools,this.currencyName);
            this.poolList = marketPools;
            this.processPoolstable(marketPools);
          }
        });

        this.masterWalletManagerService.totalVolume24H$.subscribe(volume => volume != null ? this.totalVolume24H = volume : null);
        this.masterWalletManagerService.totalVolume1M$.subscribe(volume => volume != null ? this.totalVolume1M = volume : null);

        this.masterWalletManagerService.totalSwap24H$.subscribe(swap => swap != null ? this.totalSwap24H = swap : null);
        this.masterWalletManagerService.totalSwap1M$.subscribe(swap => swap != null ? this.totalSwap1M = swap : null);

      }
    });

    this.masterWalletManagerService.walletResume$.subscribe(resume => {
      if(resume != null){
        this.resume = resume;
      }else{
        setTimeout(() => {
          this.masterWalletManagerService.createResume(this.currencyName);
        }, 5000);
      }
    });

    this.masterWalletManagerService.globalShowHide$.subscribe(value => {
      if( value != null){
        this.showHideToggle = value;
      }
    });

  }

  processPoolstable(poolList: MarketPool[]){

    //for top bar
    this.activePools = poolList.filter(pool => pool.status == 'available').length;
    let activePoolsList = poolList.filter(pool => pool.status == 'available');
    let totalDepth = 0;
    let totalVolume24H = 0;
    for (let i = 0; i < activePoolsList.length; i++) {
      totalDepth = totalDepth + activePoolsList[i].depth;
      totalVolume24H = totalVolume24H + activePoolsList[i].volume;   
    }

    

    this.totalDepth = totalDepth / 100000000;
    this.totalVolume24H = totalVolume24H / 100000000;
    //

    let priceChangeHistory: DepthPriceHistory[] = [];

    this.masterWalletManagerService.getOriginalPriceChange().subscribe(priceChange => {

      if(priceChange == null){

        for (let i = 0; i < poolList.length; i++) {

          let date = moment().format('X');
          let dateMinus7D = moment(+date * 1000).subtract(7,'days').format('X');

          this.masterWalletManagerService.getDepthPriceHistory(poolList[i].asset.fullname,'day',dateMinus7D,date).subscribe(data => {
            data.asset = poolList[i].asset.fullname;
            priceChangeHistory.push(data);

            if(priceChangeHistory.length == poolList.length){
              if(priceChange == null){

                this.masterWalletManagerService.setOriginalPriceChange(priceChangeHistory);

              }
            }
          },error => {

            setTimeout(() => {

              let date = moment().format('X');
              let dateMinus7D = moment(+date * 1000).subtract(7,'days').format('X');

              this.masterWalletManagerService.getDepthPriceHistory(poolList[i].asset.fullname,'day',dateMinus7D,date).subscribe(data => {
                data.asset = poolList[i].asset.fullname;
                priceChangeHistory.push(data);
    
                if(priceChangeHistory.length == poolList.length){
                  if(priceChange == null){
    
                    this.masterWalletManagerService.setOriginalPriceChange(priceChangeHistory);
    
                  }
                }
              },error => {

                setTimeout(() => {

                  let date = moment().format('X');
                  let dateMinus7D = moment(+date * 1000).subtract(7,'days').format('X');

                  this.masterWalletManagerService.getDepthPriceHistory(poolList[i].asset.fullname,'day',dateMinus7D,date).subscribe(data => {
                    data.asset = poolList[i].asset.fullname;
                    priceChangeHistory.push(data);
                  
                    if(priceChangeHistory.length == poolList.length){
                      if(priceChange == null){
                      
                        this.masterWalletManagerService.setOriginalPriceChange(priceChangeHistory);
                      
                      }
                    }
                  },error => {
                  
                    let priceData: DepthPriceHistory = {
                      asset: poolList[i].asset.fullname,
                      intervals: null,
                      meta: null
                    };
                  
                    priceChangeHistory.push(priceData);
                    if(priceChangeHistory.length == poolList.length){
                      if(priceChange == null){
                      
                        this.masterWalletManagerService.setOriginalPriceChange(priceChangeHistory);
                      
                      }
                    }
                  });

                }, 5000);

              });
            }, 5000);

          });

        }

      }else{

        this.getPriceChange(priceChange); 
      }

    });

    this.dataSource = new MatTableDataSource(poolList);
    this.dataSource.paginator = this.paginator;
  }

  getPriceChange(priceChangeHistory: DepthPriceHistory[]){

    for (let i = 0; i < priceChangeHistory.length; i++) {

      let priceList = [];

      if(priceChangeHistory[i].intervals != null){
        for (let y = 0; y < priceChangeHistory[i].intervals.length; y++) {
      
          let assetPrice = 0;
          if(this.currencyName == 'USD'){
            assetPrice = +priceChangeHistory[i].intervals[y].assetPriceUSD;
          }else{
            assetPrice = +priceChangeHistory[i].intervals[y].assetPrice;
          }
          
          priceList.push(assetPrice.toFixed(4));

        }

        let priceListLenght = priceList.length;
    
        // price diff for 24H
        let priceDiff = +priceList[priceListLenght - 1] - +priceList[priceListLenght - 2];
        let priceChange = +priceList[priceListLenght - 2] == 0 ? 0 : (priceDiff / +priceList[priceListLenght - 2]) * 100;

        // price diff for 7D
        let priceDiff7D = +priceList[priceListLenght - 1] - +priceList[0];
        let priceChange7D = (priceDiff7D / +priceList[0]) * 100;
        
        let poolIndex = this.poolList.findIndex(pool => pool.asset.fullname == priceChangeHistory[i].asset);

        this.poolList[poolIndex].perc = priceChange;
        this.poolList[poolIndex].weeklyChange = priceChange7D;

        //this to avoid infinite values
        if(+priceList[0] == 0){
          this.poolList[poolIndex].weeklyChange = 100;
        }
        if(+priceList[priceListLenght - 2] == 0){
          this.poolList[poolIndex].perc = 100;
        }

        let graphColor = '';
        
        if(priceChange7D > 0){
          graphColor = '103, 157, 85';
        }else if(priceChange == 0){
          graphColor = '255, 149, 0';
        }else{
          graphColor = '241, 56, 56'
        }


        this.poolList[poolIndex].graph = {
          grid: {
            height: 40,
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
            min: this.getMinValue(priceList),
            show:false
          },
          series: [{
            data: priceList,
            type: 'line',
            smooth: true,
            symbol: "none",
            lineStyle: { 
              normal: {
                color: 'rgba(' + graphColor + ', 1)',
              }, 
            },
            areaStyle:{ 
              normal: {
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(' + graphColor + ', 1)' },
                  { offset: 0.7, color: 'rgba(' + graphColor + ', 0.5)' },
                  { offset: 1, color: 'rgba(255, 255, 255, 0)' },
                ]),
              }, 
            }
          }]
        };

        this.poolList[poolIndex].isLoading = false;

      }
    }

    console.log(this.poolList);

    this.dataSource = new MatTableDataSource(this.poolList);
    this.dataSource.paginator = this.paginator;
  }

  getMinValue(priceList: any[]){
    return priceList.reduce(function (p, v) {
      return ( +p < +v ? +p : +v );
    });
  }

  setTheme(){
    if(this.themeValue == 'light-theme'){
      this.themeValue = 'dark-theme';
      this.columDark = true;
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
    }else{
      this.themeValue = 'light-theme';
      this.columDark = false;
      localStorage.setItem('dcf-theme',this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
    }
  }

  setPaginatorPageSize(size: number){
    this.poolRatesTablePageSize = size;
    this.paginator.pageSize = size;
    this.dataSource.paginator = this.paginator;
  }
  
  getPaginatorClass(size){
    if(size == this.poolRatesTablePageSize){
      return 'page-size-selected';
    }else{
      return 'page-size';
    }
  }

  getStatusClass(status: string): string{
    let statusClass = '';
    status == 'available' ? statusClass = 'status-dot green' : statusClass = 'status-dot yellow';
    return statusClass;
  }

  getPercClass(perc: number): string{
    let statusClass = '';
    perc > 0 ? statusClass = 'perc-green' : statusClass = 'perc-red';
    if(perc == 0){statusClass = 'perc-yellow'}
    return statusClass;
  }

  getSimbol(title?: boolean){
    if (this.currencyName == 'RUNE'){
      return 'ᚱ';
    }else if (this.currencyName == 'USD'){
      return '$';
    }else{
      if(title){
        return '$';
      }else{
        return '';
      }
    }
  }

  sortData(sort: Sort) {

    const data = this.poolList.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      this.dataSource = new MatTableDataSource(this.sortedData);
      this.dataSource.paginator = this.paginator;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'rank': return compare(a.rank, b.rank, isAsc);
        case 'name': return compare(a.name, b.name, isAsc);
        case 'asset': return compare(a.asset.symbol, b.asset.symbol, isAsc);
        case 'chain': return compare(a.chain, b.chain, isAsc);
        case 'price': return compare(a.price, b.price, isAsc);
        case 'depth': return compare(a.depth, b.depth, isAsc);
        case 'volume': return compare(a.volume, b.volume, isAsc);
        case 'perc': return compare(a.perc, b.perc, isAsc);
        case 'status': return compare(a.status, b.status, isAsc);
        default: return 0;
      }
    });

    this.dataSource = new MatTableDataSource(this.sortedData);
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();

    this.dataSource.filterPredicate = function(data, filter: string): boolean {
      return data.asset.ticker.toLowerCase().includes(filter) || data.asset.ticker.toLowerCase().includes(filter);
    };

    let newfilteredData = [];

    for (let i = 0; i < this.poolList.length; i++) {
      let predicate = this.dataSource.filterPredicate(this.poolList[i],filterValue);
      if(predicate == true){
        newfilteredData.push(this.poolList[i]);
      }      
    }

    this.dataSource = new MatTableDataSource(newfilteredData);
    this.dataSource.paginator = this.paginator;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  validateSize(){

    /*setTimeout(() => {

      let bodyHeight = document.body.scrollHeight;
      let element = document.getElementById("table-id");

      if(bodyHeight < 500){
        element.classList.add("full");
      }else{
        element.classList.remove("full");
      }      

    }, 500);*/

  }

  tdColorOne(){
    if(localStorage.getItem('dcf-theme') == 'light-theme'){
      return 'td-stiky-ligth1';
    }else{
      return 'td-stiky-dark1';
    }
  }

  tdColorTwo(){
    if(localStorage.getItem('dcf-theme') == 'light-theme'){
      return 'td-stiky-ligth2';
    }else{
      return 'td-stiky-dark2';
    }
  }

  goTo(link: string){
    window.open(link,'_blank');
  }

  goToDetails(asset: string){
    console.log('test');
    this.router.navigate(['pool/' + asset])
  }

}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
