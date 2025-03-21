export interface SpeedTest {
    start: () => void;
    stop: () => void;
    average: () => number;
}
export declare function createSpeedTest(test: () => Promise<void>, frequencyMs: number, samples?: number): SpeedTest;
