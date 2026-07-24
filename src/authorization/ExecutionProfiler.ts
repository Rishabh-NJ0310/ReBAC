export interface RuleProfileMetric {
    rule: string;
    durationMs: number;
    result: boolean;
}

export interface ExecutionProfile {
    totalTimeMs: number;
    dbLookups: number;
    maxRecursionDepth: number;
    memoHits: number;
    ruleBreakdown: RuleProfileMetric[];
}

export class ExecutionProfiler {
    private startTime: number = 0;
    private dbLookupCount: number = 0;
    private currentDepth: number = 0;
    private maxDepth: number = 0;
    private memoHitCount: number = 0;
    private breakdown: RuleProfileMetric[] = [];

    public start(): void {
        this.startTime = performance.now();
        this.dbLookupCount = 0;
        this.currentDepth = 0;
        this.maxDepth = 0;
        this.memoHitCount = 0;
        this.breakdown = [];
    }

    public incrementDbLookup(): void {
        this.dbLookupCount++;
    }

    public incrementMemoHit(): void {
        this.memoHitCount++;
    }

    public enterDepth(): void {
        this.currentDepth++;
        if (this.currentDepth > this.maxDepth) {
            this.maxDepth = this.currentDepth;
        }
    }

    public exitDepth(): void {
        if (this.currentDepth > 0) {
            this.currentDepth--;
        }
    }

    public recordRule(rule: string, durationMs: number, result: boolean): void {
        this.breakdown.push({
            rule,
            durationMs: Number(durationMs.toFixed(3)),
            result
        });
    }

    public getProfile(): ExecutionProfile {
        const totalTimeMs = Number((performance.now() - this.startTime).toFixed(3));
        return {
            totalTimeMs,
            dbLookups: this.dbLookupCount,
            maxRecursionDepth: this.maxDepth,
            memoHits: this.memoHitCount,
            ruleBreakdown: [...this.breakdown]
        };
    }
}
