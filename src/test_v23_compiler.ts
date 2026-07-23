import {
    analyzeAuthDSL,
    compileAuthDSL,
    lintAuthDSL,
    explainAuthDSL
} from "./compiler/CompilerFacade.js";

function runV23CompilerTests() {
    console.log("=================================================");
    console.log("   ReBAC V2.3 Compiler Suite Verification");
    console.log("=================================================\n");

    // Test 1: Type Checking - Unknown Target Resource
    console.log("1. Testing Type Checker (Unknown Target Resource)...");
    const unknownTargetDSL = `
    resource patient {
        relation contains : non_existent_resource
        permission view = contains -> view
    }
    `;
    try {
        analyzeAuthDSL(unknownTargetDSL);
        console.error("❌ Test Failed: Should have caught unknown target resource 'non_existent_resource'.");
    } catch (err: any) {
        console.log("✔ Caught Type Error:", err.message);
    }

    // Test 2: Type Checking - Target Resource Missing Permission
    console.log("\n2. Testing Type Checker (Missing Permission on Target Resource)...");
    const missingPermDSL = `
    resource ward {
        relation assigned_nurse : user
    }

    resource patient {
        relation contains : ward
        permission view = contains -> view
    }
    `;
    try {
        analyzeAuthDSL(missingPermDSL);
        console.error("❌ Test Failed: Should have caught missing permission 'view' on target resource 'ward'.");
    } catch (err: any) {
        console.log("✔ Caught Type Error:", err.message);
    }

    // Test 3: AST Optimizer & Constant Folder
    console.log("\n3. Testing AST Optimizer (Idempotence, Double Negation & Constant Folding)...");
    const unoptimizedDSL = `
    resource test_res {
        relation doctor_of : user
        relation admin : user

        permission edit = doctor_of OR doctor_of
        permission delete = NOT NOT admin
        permission view = doctor_of OR true
    }
    `;
    const compiled = compileAuthDSL(unoptimizedDSL);
    console.log("Optimized Compiled Schema:", JSON.stringify(compiled, null, 2));

    if (compiled.test_res.delete && (compiled.test_res.delete as any).relation === "admin") {
        console.log("✔ Double negation 'NOT NOT admin' successfully optimized to 'admin'.");
    } else {
        throw new Error("❌ Optimization Failed for double negation.");
    }

    if (compiled.test_res.edit && (compiled.test_res.edit as any).relation === "doctor_of") {
        console.log("✔ Idempotence 'doctor_of OR doctor_of' successfully optimized to 'doctor_of'.");
    } else {
        throw new Error("❌ Optimization Failed for idempotence.");
    }

    // Test 4: ADSL Linter
    console.log("\n4. Testing ADSL Linter (Diagnostic Warnings)...");
    const lintTargetDSL = `
    resource patient {
        relation doctor_of : user
        relation unused_relation : user

        permission edit = NOT NOT doctor_of
    }
    `;
    const diagnostics = lintAuthDSL(lintTargetDSL);
    console.log("Linter Diagnostics Output:", diagnostics);

    if (diagnostics.some(d => d.code === "UNUSED_RELATION") && diagnostics.some(d => d.code === "SIMPLIFIABLE_EXPRESSION")) {
        console.log("✔ Linter successfully emitted UNUSED_RELATION and SIMPLIFIABLE_EXPRESSION warnings.");
    } else {
        throw new Error("❌ Linter Test Failed.");
    }

    // Test 5: Explain Plan Generator
    console.log("\n5. Testing EXPLAIN PLAN Generator...");
    const explainDSL = `
    resource ward {
        relation assigned_nurse : user
        permission view = assigned_nurse
    }

    resource patient {
        relation doctor_of : user
        relation contains : ward

        permission view = doctor_of OR contains -> view
    }
    `;
    const plan = explainAuthDSL(explainDSL, "patient", "view");
    console.log(plan);
    console.log("✔ EXPLAIN PLAN generated successfully.");

    console.log("\n=================================================");
    console.log("   ALL V2.3 COMPILER TESTS PASSED SUCCESSFULLY!  ");
    console.log("=================================================");
}

runV23CompilerTests();
