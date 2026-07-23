import { compileAuthDSL, parseAuthDSLToAST } from "./compiler/CompilerFacade.js";

function testCompiler() {
    console.log("=== 1. Testing Valid DSL Compilation ===");
    const validDSL = `
    # Test DSL Schema

    resource patient {
        relation doctor_of
        relation contains

        permission view =
            doctor_of
            OR contains -> view
    }
    `;

    const compiled = compileAuthDSL(validDSL);
    console.log("Compiled Schema Output:", JSON.stringify(compiled, null, 2));

    if (compiled.patient && compiled.patient.view) {
        console.log("✔ Patient view permission compiled successfully.");
    } else {
        throw new Error("❌ Test Failed: Patient view permission missing.");
    }

    console.log("\n=== 2. Testing Operator Precedence ===");
    const precedenceDSL = `
    resource test_res {
        relation a
        relation b
        relation c

        permission test_perm =
            a AND b OR c
    }
    `;
    const precedenceAST = parseAuthDSLToAST(precedenceDSL);
    console.log("Precedence AST Output:", JSON.stringify(precedenceAST, null, 2));

    console.log("\n=== 3. Testing Semantic Error Detection (Undeclared Relation) ===");
    const invalidDSL = `
    resource patient {
        relation doctor_of

        permission view =
            doctor_ofo
    }
    `;

    try {
        compileAuthDSL(invalidDSL);
        console.error("❌ Test Failed: Compiler should have caught undeclared relation 'doctor_ofo'.");
    } catch (err: any) {
        console.log("✔ Caught expected semantic error:", err.message);
    }
}

testCompiler();
