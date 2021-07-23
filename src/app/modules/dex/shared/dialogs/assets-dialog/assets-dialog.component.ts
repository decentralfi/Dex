import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MidgardService } from '../../services/midgard.service';
import { environment } from 'src/environments/environment';
import { Asset } from '../../classes/asset';
import { AssetBalance } from '../../interfaces/asset-balance';
import { WalletBalanceService } from '../../services/wallet-balance.service';

type AssetAndBalance = {
  asset: Asset,
  balance?: AssetBalance,
};

@Component({
  selector: 'app-assets-dialog',
  templateUrl: './assets-dialog.component.html',
  styleUrls: ['./assets-dialog.component.scss']
})
export class AssetsDialogComponent implements OnInit {

  loading: boolean;
  marketListItems: AssetAndBalance[];
  filteredMarketListItems: AssetAndBalance[];
  walletBalances: AssetBalance[];
  _searchTerm: string;

  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(term: string) {
    this._searchTerm = term;

    if (term && term.length > 0) {
      this.filteredMarketListItems = this.marketListItems.filter((item) => {
        const search = term.toUpperCase();
        return item.asset.symbol.includes(search);
      });
    } else {
      this.filteredMarketListItems = this.marketListItems;
    }
  }  

  constructor(
    public dialogRef: MatDialogRef<AssetsDialogComponent>,
    private midgardService: MidgardService,
    private walletBalanceService: WalletBalanceService,
    @Inject(MAT_DIALOG_DATA) public data: {field: any, disabledAssetSymbol: string}
  ) { }

  ngOnInit() {
    this.getPools();
  }

  getPools() {
    this.loading = true;
    this.midgardService.getPools().subscribe(
      (res) => {
        const sortedByName = res.sort();

        this.marketListItems = sortedByName.map((poolName) => ({
          asset: new Asset(poolName),
        }));

        // Keeping RUNE at top by default
        this.marketListItems.unshift({
          asset: new Asset(
            environment.network === 'chaosnet' ? 'BNB.RUNE-B1A' : 'BNB.RUNE-67C'
          ),
        });
        this.filteredMarketListItems = this.marketListItems;

        this.walletBalanceService.walletBalances$.subscribe((balances) => {
          this.walletBalances = balances;
          this.sortMarketsByUserBalance();
          this.loading = false;
        });
      },
      (err) => console.error('error fetching pools: ', err)
    );
  }

  sortMarketsByUserBalance(): void {
    // Sort first by user balances
    if (this.walletBalances) {

      const balMap = {};
      this.walletBalances.forEach((item) => {
        balMap[item.asset] = item;
      });

      this.marketListItems = this.marketListItems.map((mItem) => {
        return {
          asset: mItem.asset,
          balance: balMap[mItem.asset.symbol],
        };
      });

      this.marketListItems = this.marketListItems.sort((a, b) => {
        if (!a.balance && !b.balance) { return 0; }
        if (!a.balance) { return 1; }
        if (!b.balance) { return -1; }
        return (
          b.balance.assetValue.amount().toNumber() -
          a.balance.assetValue.amount().toNumber()
        );
      });
      this.filteredMarketListItems = this.marketListItems;
    }
  }

  selectToken(item){

    if (item.asset.ticker !== this.data.disabledAssetSymbol) {
      let returnObject = {
        item: item,
        field: this.data.field
      }
      this.dialogRef.close(returnObject);
    }
    
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
