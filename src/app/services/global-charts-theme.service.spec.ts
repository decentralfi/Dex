/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { GlobalChartsThemeService } from './global-charts-theme.service';

describe('Service: GlobalChartsTheme', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalChartsThemeService]
    });
  });

  it('should ...', inject([GlobalChartsThemeService], (service: GlobalChartsThemeService) => {
    expect(service).toBeTruthy();
  }));
});
