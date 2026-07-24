import crypto from "crypto";
import { RebacSchema } from "../../authorization/Schema.js";

export class CompilationCache {
    private cache = new Map<string, { schema: RebacSchema; timestamp: number }>();
    private hits: number = 0;
    private misses: number = 0;

    public computeHash(source: string): string {
        return crypto.createHash("sha256").update(source).digest("hex");
    }

    public get(hash: string): RebacSchema | undefined {
        const cached = this.cache.get(hash);
        if (cached) {
            this.hits++;
            return cached.schema;
        }
        this.misses++;
        return undefined;
    }

    public set(hash: string, schema: RebacSchema): void {
        this.cache.set(hash, {
            schema,
            timestamp: Date.now()
        });
    }

    public getStats() {
        return {
            cachedEntries: this.cache.size,
            hits: this.hits,
            misses: this.misses
        };
    }

    public clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
}

export const globalCompilationCache = new CompilationCache();
