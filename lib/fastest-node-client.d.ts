import { Chain, ChainClient, ChainOptions, RandomnessBeacon } from './index';
import { SpeedTest } from './speedtest';
type SpeedTestEntry = {
    test: SpeedTest;
    url: string;
};
declare class FastestNodeClient implements ChainClient {
    baseUrls: Array<string>;
    options: ChainOptions;
    private speedTestIntervalMs;
    speedTests: Array<SpeedTestEntry>;
    speedTestHttpOptions: {
        userAgent: string;
    };
    constructor(baseUrls: Array<string>, options?: ChainOptions, speedTestIntervalMs?: number);
    latest(): Promise<RandomnessBeacon>;
    get(roundNumber: number): Promise<RandomnessBeacon>;
    chain(): Chain;
    start(): void;
    current(): Chain;
    stop(): void;
}
export default FastestNodeClient;
