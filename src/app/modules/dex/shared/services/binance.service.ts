import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Fee, Fees, TransferFee, DexFees, BinanceClient, Client as binanceClient, } from '@thorchain/asgardex-binance';
import { Observable } from 'rxjs';
import { TransferFees } from '../classes/binance-fee';
import { baseAmount } from '@thorchain/asgardex-token';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {

  private _baseUrl: string;
  private _asgardexBncClient: BinanceClient;

  get bncClient() {
    return this._asgardexBncClient.getBncClient();
  }

  constructor(private http: HttpClient) {

    this._baseUrl = (environment.network === 'testnet')
      ? 'https://testnet-dex.binance.org/api/v1'
      : 'https://dex.binance.org/api/v1';

    this._asgardexBncClient = new binanceClient({
      network: environment.network === 'testnet' ? 'testnet' : 'mainnet',
    });

  }

  getBinanceFees(): Observable<Fees> {
    return this.http.get<Fees>(`${this._baseUrl}/fees`);
  }

  getTransferFees(feesData: Fees) {

    const fees = this.getTransferFeeds(feesData);
    if (fees) {
      return fees;
    } else {
      return null;
    }

  }

  getTransferFeeds(fees: Fees): TransferFees {
    return fees.reduce((acc: TransferFees, dataItem) => {
      if (!acc && this.isTransferFee(dataItem)) {
        const single = dataItem.fixed_fee_params.fee;
        const multi = dataItem.multi_transfer_fee;
        if (single && multi) {
          return { single: baseAmount(single), multi: baseAmount(multi) } as TransferFees;
        }
        return null;
      }
      return acc;
    }, null);
  }

  /**
   * Type guard for `TransferFee`
   */
  isTransferFee(v: Fee | TransferFee | DexFees): v is TransferFee {
    return this.isFee((v as TransferFee)?.fixed_fee_params) &&
    !!(v as TransferFee)?.multi_transfer_fee;
  }

  /**
   * Type guard for runtime checks of `Fee`
   */
  isFee(v: Fee | TransferFee | DexFees): v is Fee {
    return !!(v as Fee)?.msg_type &&
    (v as Fee)?.fee !== undefined &&
    (v as Fee)?.fee_for !== undefined;
  }

  getTx(hash: string) {
    const params = new HttpParams().set('format', 'json');
    return this.http.get(`${this._baseUrl}/tx/${hash}`, { params });
  }

  getPrefix() {

    if (this._asgardexBncClient) {
      return this._asgardexBncClient.getPrefix();
    } else {
      console.error('this._asgardexBncClient not set');
    }

  }

}
