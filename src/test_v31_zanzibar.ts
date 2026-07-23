import { analyzeAuthDSL, compileAuthDSL } from "./compiler/CompilerFacade.js";
import { graphRepository } from "./authorization/GraphRepository.js";
import { authorizationService } from "./authorization/AuthorizationService.js";

async function runV31ZanzibarTests() {
    console.log("=================================================");
    console.log("   ReBAC V3.1 Zanzibar Features Verification");
    console.log("=================================================\n");

    // Test 1: Cycle Detection in Computed Usersets
    console.log("1. Testing Permission Dependency Graph Cycle Detection...");
    const circularDSL = `
    subject user

    resource patient {
        relation doctor_of : user
        permission view = edit
        permission edit = view
    }
    `;

    try {
        analyzeAuthDSL(circularDSL);
        console.error("❌ Test Failed: Should have caught circular dependency view -> edit -> view.");
    } catch (err: any) {
        console.log("✔ Caught Circular Dependency Error:", err.message);
    }

    // Test 2: Dot Notation Parsing & Compilation
    console.log("\n2. Testing Dot Notation Syntax (parent.view)...");
    const dotNotationDSL = `
    subject user

    resource ward {
        relation nurse : user
        permission view = nurse
    }

    resource patient {
        relation parent : ward
        permission view = parent.view
    }
    `;

    const compiledDotSchema = compileAuthDSL(dotNotationDSL);
    console.log("Compiled Dot Notation Schema:", JSON.stringify(compiledDotSchema, null, 2));
    if (compiledDotSchema.patient.view && (compiledDotSchema.patient.view as any).permission === "view") {
        console.log("✔ 'parent.view' dot notation successfully compiled into tuple-to-userset rule.");
    } else {
        throw new Error("❌ Dot notation compilation failed.");
    }

    // Test 3: Computed Userset Runtime Evaluation
    console.log("\n3. Testing Computed Userset Runtime Evaluation (view -> medical_staff -> doctor_of)...");
    await graphRepository.deleteAll();

    const drRaj = await graphRepository.createUser({
        name: "DrRaj",
        email: "raj@zanzibar.org",
        password: "pass"
    });

    const patient202 = await graphRepository.createResource({
        type: "patient",
        name: "Patient202"
    });

    // Assign doctor_of relationship
    await graphRepository.createRelationship({
        relation: "doctor_of",
        subjectId: drRaj.subjectId,
        objectId: patient202.id
    });

    const outcome = await authorizationService.checkPermission({
        userId: drRaj.id,
        resourceId: patient202.id,
        permission: "view"
    });

    console.log("Check Verdict:", outcome.allowed ? "ALLOWED" : "DENIED");
    console.log("Trace:", outcome.trace);

    if (outcome.allowed) {
        console.log("\n=================================================");
        console.log("   V3.1 ZANZIBAR FEATURES PASSED CLEANLY!       ");
        console.log("=================================================");
    } else {
        throw new Error("❌ V3.1 Computed Userset Evaluation Failed.");
    }
}

runV31ZanzibarTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
