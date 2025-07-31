export class Random {
    private currSeed: number;
    private initialSeed: number;

    constructor(seed: number) {
        this.currSeed = seed >>> 0;
        this.initialSeed = this.currSeed;
    }
    public get seed(){
        return this.initialSeed
    }

    // Mulberry32 PRNG
    private next(): number {
        this.currSeed |= 0;
        this.currSeed = (this.currSeed + 0x6D2B79F5) | 0;
        let t = Math.imul(this.currSeed ^ (this.currSeed >>> 15), 1 | this.currSeed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Reset RNG to initial seed */
    public reset(): void {
        this.currSeed = this.initialSeed;
    }

    /** Random number in [0,1) */
    public random(): number {
        return this.next();
    }

    /** Uniform distribution: random number in [min, max) */
    public uniDist(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /** Random integer between min and max (inclusive) */
    public randInt( max: number): number {
        return Math.floor(this.random() * max)
    }
    public randFloat( max: number): number {
        return (this.random() * max)
    }
    /** Triangular distribution (min ≤ mode ≤ max) */
    public triDist(mean:number,range:number): number {
        return mean + this.randFloat(range) + this.randFloat(range) - range
    }

    /** Gaussian (normal) distribution using Box-Muller transform */
    public gaussian(mean = 0, stdDev = 1): number {
        let u = 0, v = 0;
        // Ensure u and v are in (0,1)
        while (u === 0) u = this.next();
        while (v === 0) v = this.next();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * stdDev;
    }

    /** Fisher-Yates shuffle (in-place) */
    public shuffle<T>(arr: T[]): T[] {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.randInt( i);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr
    }
    public sample(probability: number): boolean {
        return this.random() < probability
    }
    public randDice() {
        return Math.ceil(this.random() * 6)
    }
    public randBool(prob: number = 2) {
        return this.randInt(prob) === 0
    }

    public chooseRandom<T>(list: T[]): T {
        return list[Math.floor(this.random() * list.length)]
    }
    public chooseRandomMultiple<T>(list: T[], count: number): T[] {
        if (count > list.length) return []
        return this.shuffle(list).slice(0, count)
    }
    /** Weighted random selection */
    public chooseWeightedRandom(weights: number[]): number {
        for (let i = 1; i < weights.length; ++i) {
            weights[i] = weights[i] + weights[i - 1]
        }
        let rand = this.random() * weights[weights.length - 1]
        for (let i = 0; i < weights.length; ++i) {
            if (weights[i] > rand) return i
        }
	return 0
    }
}
