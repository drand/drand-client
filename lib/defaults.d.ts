import { ChainInfo } from './index';
import HttpChainClient from './http-chain-client';
export declare const DEFAULT_CHAIN_URL = "https://api.drand.sh";
export declare const DEFAULT_CHAIN_INFO: {
    public_key: string;
    period: number;
    genesis_time: number;
    hash: string;
    groupHash: string;
    schemeID: string;
    metadata: {
        beaconID: string;
    };
};
export declare const QUICKNET_CHAIN_URL = "https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
export declare const QUICKNET_CHAIN_INFO: {
    public_key: string;
    period: number;
    genesis_time: number;
    hash: string;
    groupHash: string;
    schemeID: string;
    metadata: {
        beaconID: string;
    };
};
export declare const FASTNET_CHAIN_URL = "https://api.drand.sh/dbd506d6ef76e5f386f41c651dcb808c5bcbd75471cc4eafa3f4df7ad4e4c493";
export declare const FASTNET_CHAIN_INFO: ChainInfo;
export declare const TESTNET_DEFAULT_CHAIN_URL = "https://pl-us.testnet.drand.sh";
export declare const TESTNET_DEFAULT_CHAIN_INFO: ChainInfo;
export declare const TESTNET_QUICKNET_CHAIN_URL = "https://pl-us.testnet.drand.sh/cc9c398442737cbd141526600919edd69f1d6f9b4adb67e4d912fbc64341a9a5";
export declare const TESTNET_QUICKNET_CHAIN_INFO: ChainInfo;
export declare function defaultClient(): HttpChainClient;
export declare function quicknetClient(): HttpChainClient;
export declare function fastnetClient(): HttpChainClient;
export declare function testnetDefaultClient(): HttpChainClient;
export declare function testnetQuicknetClient(): HttpChainClient;
