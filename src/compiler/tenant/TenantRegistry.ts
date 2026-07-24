import { compileAuthDSLFile } from "../../compiler/CompilerFacade.js";
import { CompilationCache } from "../../compiler/cache/CompilationCache.js";
import { RebacSchema } from "../../authorization/Schema.js";
import fs from "fs";

export interface TenantConfig {
    tenantId: string;
    schemaPath: string;
}

export class TenantRegistry {
    private tenants = new Map<string, { config: TenantConfig; cache: CompilationCache; schema: RebacSchema }>();

    public register(config: TenantConfig): void {
        const source = fs.existsSync(config.schemaPath)
            ? fs.readFileSync(config.schemaPath, "utf-8")
            : "";
        const cache = new CompilationCache();
        const hash = cache.computeHash(source + config.schemaPath);

        let schemaResult = cache.get(hash);
        if (!schemaResult) {
            schemaResult = compileAuthDSLFile(config.schemaPath);
            cache.set(hash, schemaResult);
        }

        this.tenants.set(config.tenantId, { config, cache, schema: schemaResult });
        console.log(`[TenantRegistry] Registered tenant '${config.tenantId}' with schema at '${config.schemaPath}'`);
    }

    public getSchema(tenantId: string): RebacSchema {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            throw new Error(`Tenant Error: Tenant '${tenantId}' is not registered.`);
        }
        return tenant.schema;
    }

    public invalidate(tenantId: string): void {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            throw new Error(`Tenant Error: Tenant '${tenantId}' not found for invalidation.`);
        }
        tenant.cache.clear();
        const source = fs.existsSync(tenant.config.schemaPath)
            ? fs.readFileSync(tenant.config.schemaPath, "utf-8")
            : "";
        const hash = tenant.cache.computeHash(source + tenant.config.schemaPath);
        const newSchema = compileAuthDSLFile(tenant.config.schemaPath);
        tenant.cache.set(hash, newSchema);
        tenant.schema = newSchema;
        console.log(`[TenantRegistry] Invalidated and recompiled schema for tenant '${tenantId}'`);
    }

    public listTenants(): string[] {
        return Array.from(this.tenants.keys());
    }

    public has(tenantId: string): boolean {
        return this.tenants.has(tenantId);
    }
}

export const globalTenantRegistry = new TenantRegistry();
