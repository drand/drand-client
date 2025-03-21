import { Chain, ChainOptions, DrandNode, HealthCheckResponse } from './index';
declare class MultiBeaconNode implements DrandNode {
    baseUrl: string;
    private options;
    constructor(baseUrl: string, options?: ChainOptions);
    chains(): Promise<Array<Chain>>;
    health(): Promise<HealthCheckResponse>;
}
export default MultiBeaconNode;
