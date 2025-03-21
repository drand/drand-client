import HttpCachingChain from './http-caching-chain';
import { HttpChain } from './http-caching-chain';
import HttpChainClient from './http-chain-client';
import FastestNodeClient from './fastest-node-client';
import MultiBeaconNode from './multi-beacon-node';
import { roundAt, roundTime } from './util';
import { defaultClient, fastnetClient, quicknetClient, testnetDefaultClient, testnetQuicknetClient } from './defaults';
export interface DrandNode {
    chains(): Promise<Array<Chain>>;
    health(): Promise<HealthCheckResponse>;
}
export interface Chain {
    baseUrl: string;
    info(): Promise<ChainInfo>;
}
export type ChainOptions = {
    disableBeaconVerification: boolean;
    noCache: boolean;
    chainVerificationParams?: ChainVerificationParams;
};
export declare const defaultChainOptions: ChainOptions;
export type ChainVerificationParams = {
    chainHash: string;
    publicKey: string;
};
export type HealthCheckResponse = {
    status: number;
    current: number;
    expected: number;
};
export interface ChainClient {
    options: ChainOptions;
    latest(): Promise<RandomnessBeacon>;
    get(roundNumber: number): Promise<RandomnessBeacon>;
    chain(): Chain;
}
export declare function fetchBeacon(client: ChainClient, roundNumber?: number): Promise<RandomnessBeacon>;
export declare function fetchBeaconByTime(client: ChainClient, time: number): Promise<RandomnessBeacon>;
export declare function watch(client: ChainClient, abortController: AbortController, options?: WatchOptions): AsyncGenerator<RandomnessBeacon>;
export type WatchOptions = {
    retriesOnFailure: number;
};
export type ChainInfo = {
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
export type RandomnessBeacon = G2ChainedBeacon | G2UnchainedBeacon | G1UnchainedBeacon | G1RFC9380Beacon;
export type G2ChainedBeacon = {
    round: number;
    randomness: string;
    signature: string;
    previous_signature: string;
};
export type G2UnchainedBeacon = {
    round: number;
    randomness: string;
    signature: string;
    _phantomg2?: never;
};
export type G1UnchainedBeacon = {
    round: number;
    randomness: string;
    signature: string;
    _phantomg1?: never;
};
export type G1RFC9380Beacon = {
    round: number;
    randomness: string;
    signature: string;
    _phantomg19380?: never;
};
export declare function isChainedBeacon(value: any, info: ChainInfo): value is G2ChainedBeacon;
export declare function isUnchainedBeacon(value: any, info: ChainInfo): value is G2UnchainedBeacon;
export declare function isG1G2SwappedBeacon(value: any, info: ChainInfo): value is G1UnchainedBeacon;
export declare function isG1Rfc9380(value: any, info: ChainInfo): value is G1RFC9380Beacon;
export { HttpChain, HttpChainClient, HttpCachingChain, MultiBeaconNode, FastestNodeClient, roundAt, roundTime, defaultClient, quicknetClient, fastnetClient, testnetDefaultClient, testnetQuicknetClient, };
