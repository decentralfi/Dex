/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { MasterWalletManagerService } from './master-wallet-manager.service';

describe('Service: MasterWalletManager', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MasterWalletManagerService]
    });
  });

  it('should ...', inject([MasterWalletManagerService], (service: MasterWalletManagerService) => {
    expect(service).toBeTruthy();
  }));
});
