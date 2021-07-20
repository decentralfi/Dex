
export interface Marketcap {
}

export interface Pool {
    asset: string;
    assetDepth: string;
    assetPrice: string;
    assetPriceUSD: string;
    poolAPY: string;
    runeDepth: string;
    status: string;
    units: string;
    volume24h: string;
}

export interface MarketPool {
    rank: number;
    name: string;
    asset: AssetName;
    chain: string;
    price: number;
    depth: number;
    volume: number;
    perc: number;
    weeklyChange: number;
    graph: any;
    status: string;
    isLoading: boolean;
}

export interface PoolDetail {
    rank: number;
    name: string;
    asset: AssetName;
    chain: string;
    price: number;
    depth: number;
    volume: number;
    perc: number;
    weeklyChange: number;
    swaps: number;
    buys: number;
    sells: number;
    swapFee: number;
    members: number;
    apy: number;
    swapSize: number;
    graph: any;
    status: string;
    isLoading: boolean;    
}

export interface AssetName {
    fullname?: string;
    chain?: string;
    symbol?: string;
    ticker?: string;
    iconPath?: string;
}


export interface DepthPriceHistory {
    asset?: string;
    intervals: Interval[];
    meta: Meta;
    
}

export interface Interval {
    assetDepth: string;
    assetPrice: string;
    assetPriceUSD: string;
    endTime: string;
    liquidityUnits: string;
    runeDepth: string;
    startTime: string;
}

export interface Meta {
    endTime: string;
    startTime: string;
}

export interface Health {
    database: boolean;
    inSync: boolean;
    scannerHeight: string;
}

export interface Queue {
    swap: number;
    outbound: number;
    internal: number;
}

export interface Stats {
    addLiquidityCount: string;
    addLiquidityVolume: string;
    dailyActiveUsers: string;
    impermanentLossProtectionPaid: string;
    monthlyActiveUsers: string;
    runeDepth: string;
    runePriceUSD: string;
    swapCount: string;
    swapCount24h: string;
    swapCount30d: string;
    swapVolume: string;
    switchedRune: string;
    toAssetCount: string;
    toRuneCount: string;
    uniqueSwapperCount: string;
    withdrawCount: string;
    withdrawVolume: string;
}

export interface Network {
    activeBonds: string[],
    activeNodeCount: string;
    blockRewards: BlockRewards,
    bondMetrics: BondMetrics,
    bondingAPY: string;
    liquidityAPY: string;
    nextChurnHeight: string;
    poolActivationCountdown: string;
    poolShareFactor: string;
    standbyBonds: string[],
    standbyNodeCount: string;
    totalPooledRune: string;
    totalReserve: string;
}

export interface BlockRewards {
    blockReward: string;
    bondReward: string;
    poolReward: string;
}

export interface BondMetrics {
    averageActiveBond: string;
    averageStandbyBond: string;
    maximumActiveBond: string;
    maximumStandbyBond: string;
    medianActiveBond: string;
    medianStandbyBond: string;
    minimumActiveBond: string;
    minimumStandbyBond: string;
    totalActiveBond: string;
    totalStandbyBond: string;
}

export interface PoolStats {
    period?: string;
    addAssetLiquidityVolume: string;
    addLiquidityCount: string;
    addLiquidityVolume: string;
    addRuneLiquidityVolume: string;
    asset: string;
    assetDepth: string;
    assetPrice: string;
    assetPriceUSD: string;
    averageSlip: string;
    impermanentLossProtectionPaid: string;
    poolAPY: string;
    runeDepth: string;
    status: string;
    swapCount: string;
    swapVolume: string;
    toAssetAverageSlip: string;
    toAssetCount: string;
    toAssetFees: string;
    toAssetVolume: string;
    toRuneAverageSlip: string;
    toRuneCount: string;
    toRuneFees: string;
    toRuneVolume: string;
    totalFees: string;
    uniqueMemberCount: string;
    uniqueSwapperCount: string;
    units: string;
    withdrawAssetVolume: string;
    withdrawCount: string;
    withdrawRuneVolume: string;
    withdrawVolume: string;
  }

  export interface HistoryField {
    roi?: FieldPool[];
    stakers?: FieldPool[];
    price?: FieldPool[];
    tooltip: string;
    total: number;
  }

  export interface FieldPool {
    asset: FieldAsset;
    pool: FieldPool[];
    total_pool: number;
  }
  export interface FieldAsset {
    id: number;
    logo: any;
    name: string;
    network: string;
    status: string;
  }
  export interface FieldPool {
    node_ip: string;
    response_success: boolean;
    time: string;
    value: number;
  }

  export interface WalletData {
    type: string;
    chain?: string;
    address: string;
    mask?: string;
    logo?: string;
    totalBalance?: number;
    explorerURL?: string;
    balance?: WalletBalance[]
    remember?: boolean;
  }

  export interface WalletBalance {
    asset: string;
    amount: number;
  }

  export interface WalletLiquidity {
    details?: string;
    pools: {[key: string]: LiquidityPoolValue};
    totals: LiquidityTotals;
  }

  export interface LiquidityPoolValue {
    pool_name?: AssetName;
    current_liquidity: LiquidityValue;
    withdraw: LiquidityValue;
    gain_loss: LiquidityValue;
    gain_loss_percentage: LiquidityDisplay;
    hodl: LiquidityDisplay;
    liquidity_added: LiquidityValue;
    lp_days: number;
  }

  export interface LiquidityTotals {
    added_liquidity: LiquidityValue;
    apy: LiquidityValue;
    current_gain_loss: LiquidityValue;
    current_liquidity: LiquidityValue;
    dpy: LiquidityValue;
    gain_loss_percentage: LiquidityValue;
    wpy: LiquidityValue;
    withdraw: LiquidityValue;
  }

  export interface LiquidityValue {
    asset: number;
    rune: number;
    total: {
      asset: number;
      rune: number;
      usd: number;
    };
  }

  export interface LiquidityPoolDisplay {
    pool_name?: AssetName;
    current_liquidity: LiquidityDisplay;
    withdraw: LiquidityDisplay;
    gain_loss: LiquidityDisplay;
    gain_loss_percentage: LiquidityDisplay;
    hodl: LiquidityDisplay;
    liquidity_added: LiquidityDisplay;
    lp_days: number;
  }

  export interface LiquidityDisplay {
    asset: number;
    rune: number;
    total: number;
  }

  export interface NONLPDetail {
    chain: string;
    asset: AssetName;
    value: number;
  }

  export interface LiquidityTrack {
    liquidity: Liquidity[];
  }

  export interface Liquidity {
    asset: FieldAsset;
    gain_loss_last_time: GainLossLastTime;
    history: LiquidityHistory[];
  }

  export interface GainLossLastTime {
    gain_loss_asset: number;
    gain_loss_rune: number;
    gain_loss_usd: number;
  }

  export interface LiquidityHistory {
    asset_share: number;
    id: number;
    liquidity: {
      asset: number;
      rune: number;
      usd: number;
    };
    rune_share: number;
    time: string;
  }