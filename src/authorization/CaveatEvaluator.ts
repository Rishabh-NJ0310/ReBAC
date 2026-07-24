export interface CaveatContext {
    userId?: number;
    resourceId?: number;
    attributes?: Record<string, any>;
    [key: string]: any;
}

export type CaveatFn = (ctx: CaveatContext) => boolean | Promise<boolean>;

export class CaveatEvaluator {
    private registry = new Map<string, CaveatFn>();

    constructor() {
        this.registerDefaults();
    }

    private registerDefaults(): void {
        // shift_active: true if attributes.shift_active === true
        this.register("shift_active", (ctx) => {
            return ctx.attributes?.shift_active === true;
        });

        // emergency_mode: true if attributes.emergency === true
        this.register("emergency_mode", (ctx) => {
            return ctx.attributes?.emergency === true;
        });

        // same_department: user.department === resource.department
        this.register("same_department", (ctx) => {
            const userDept = ctx.attributes?.user?.department;
            const resourceDept = ctx.attributes?.resource?.department;
            return userDept !== undefined && userDept === resourceDept;
        });
    }

    public register(name: string, fn: CaveatFn): void {
        this.registry.set(name, fn);
    }

    public async evaluate(caveatName: string, ctx: CaveatContext): Promise<boolean> {
        const fn = this.registry.get(caveatName);
        if (!fn) {
            throw new Error(`Caveat Error: Unknown caveat '${caveatName}'. Register it with CaveatEvaluator.register()`);
        }
        return fn(ctx);
    }

    public has(caveatName: string): boolean {
        return this.registry.has(caveatName);
    }

    public listCaveats(): string[] {
        return Array.from(this.registry.keys());
    }
}

export const globalCaveatEvaluator = new CaveatEvaluator();
