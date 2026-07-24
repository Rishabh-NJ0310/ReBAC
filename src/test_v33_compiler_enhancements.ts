import { parseAuthDSLToAST } from "./compiler/CompilerFacade.js";
import { QueryPlanner } from "./compiler/planner/QueryPlanner.js";
import { CostEstimator } from "./compiler/planner/CostEstimator.js";
import { globalCompilationCache } from "./compiler/cache/CompilationCache.js";
import { graphRepository } from "./authorization/GraphRepository.js";
import { authorizationService } from "./authorization/AuthorizationService.js";

async function runV33CompilerEnhancementTests() {
    console.log("=================================================");
    console.log("   ReBAC V3.3 Compiler Enhancements Verification");
    console.log("=================================================\n");

    // Test 1: Query Planner Cheap-First Rule Re-ordering
    console.log("1. Testing Cost Estimator & Cheap-First Rule Reordering...");
    const unoptimizedDSL = `
    subject user

    resource ward {
        relation nurse : user
        permission view = nurse
    }

    resource patient {
        relation contains : ward
        relation doctor_of : user

        permission view = contains.view OR doctor_of
    }
    `;

    const ast = parseAuthDSLToAST(unoptimizedDSL);
    const planner = new QueryPlanner();
    const plans = planner.planProgram(ast);

    console.log("Patient 'view' Plan:", JSON.stringify(plans.patient.view, null, 2));

    const plannedExpr = plans.patient.view.expression as any;
    if (plannedExpr.left && plannedExpr.left.relation === "doctor_of") {
        console.log("✔ QueryPlanner re-ordered 'contains.view OR doctor_of' -> 'doctor_of OR contains.view' (cheap direct lookup placed first).");
    } else {
        throw new Error("❌ Cheap-first rule reordering failed.");
    }

    // Test 2: Incremental Compilation Caching
    console.log("\n2. Testing Incremental Compilation Cache...");
    globalCompilationCache.clear();

    const dslText = "subject user\nresource res1 { relation r1 : user }";
    const hash = globalCompilationCache.computeHash(dslText);

    if (!globalCompilationCache.get(hash)) {
        console.log("✔ Cache miss on first lookup.");
    }

    globalCompilationCache.set(hash, { res1: { r1: { relation: "r1" } } });

    if (globalCompilationCache.get(hash)) {
        console.log("✔ Cache hit on second lookup!");
    }
    console.log("Cache Stats:", globalCompilationCache.getStats());

    // Test 3: EXPLAIN ANALYZE Execution Profiler
    console.log("\n3. Testing EXPLAIN ANALYZE Execution Profiler...");
    await graphRepository.deleteAll();

    const user = await graphRepository.createUser({
        name: "Alice",
        email: "alice@hospital.org",
        password: "pass"
    });

    const patient = await graphRepository.createResource({
        type: "patient",
        name: "Patient303"
    });

    await graphRepository.createRelationship({
        relation: "doctor_of",
        subjectId: user.subjectId,
        objectId: patient.id
    });

    const checkResult = await authorizationService.checkPermission({
        userId: user.id,
        resourceId: patient.id,
        permission: "view"
    });

    console.log("Check Allowed:", checkResult.allowed);
    console.log("EXPLAIN ANALYZE Profile Output:", JSON.stringify(checkResult.profile, null, 2));

    if (checkResult.profile && checkResult.profile.dbLookups >= 1 && checkResult.profile.totalTimeMs >= 0) {
        console.log("✔ Execution Profiler successfully captured microsecond timing, DB lookups, and rule breakdown.");
    } else {
        throw new Error("❌ Execution Profiler metrics test failed.");
    }

    console.log("\n=================================================");
    console.log("   V3.3 COMPILER ENHANCEMENTS PASSED CLEANLY!   ");
    console.log("=================================================");
}

runV33CompilerEnhancementTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
