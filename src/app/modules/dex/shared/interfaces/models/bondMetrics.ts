/**
 * Midgard Public API
 * The Midgard Public API queries THORChain and any chains linked via the Bifröst and prepares information about the network to be readily available for public users. The API parses transaction event data from THORChain and stores them in a time-series database to make time-dependent queries easy. Midgard does not hold critical information. To interact with BEPSwap and Asgardex, users should query THORChain directly.
 *
 * OpenAPI spec version: 1.0.0-oas3
 * Contact: devs@thorchain.org
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

export interface BondMetrics { 
    /**
     * Total bond of active nodes
     */
    totalActiveBond?: string;
    /**
     * Average bond of active nodes
     */
    averageActiveBond?: string;
    /**
     * Median bond of active nodes
     */
    medianActiveBond?: string;
    /**
     * Minumum bond of active nodes
     */
    minimumActiveBond?: string;
    /**
     * Maxinum bond of active nodes
     */
    maximumActiveBond?: string;
    /**
     * Total bond of standby nodes
     */
    totalStandbyBond?: string;
    /**
     * Average bond of standby nodes
     */
    averageStandbyBond?: string;
    /**
     * Median bond of standby nodes
     */
    medianStandbyBond?: string;
    /**
     * Minumum bond of standby nodes
     */
    minimumStandbyBond?: string;
    /**
     * Maximum bond of standby nodes
     */
    maximumStandbyBond?: string;
}