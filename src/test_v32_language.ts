import fs from "fs";
import path from "path";
import {
    compileAuthDSLFile,
    analyzeAuthDSL,
    compileAuthDSL
} from "./compiler/CompilerFacade.js";

function runV32LanguageTests() {
    console.log("=================================================");
    console.log("   ReBAC V3.2 Language Evolution Verification");
    console.log("=================================================\n");

    // Test 1: Multi-File Imports & Unified Schema Compilation
    console.log("1. Testing Multi-File Imports (hospital.auth -> clinical.auth + inventory.auth)...");
    const rootSchemaPath = path.resolve("src/schema/hospital.auth");
    const compiledRootSchema = compileAuthDSLFile(rootSchemaPath);
    console.log("Compiled Unified Schema Resources:", Object.keys(compiledRootSchema));

    if (
        compiledRootSchema.patient &&
        compiledRootSchema.ward &&
        compiledRootSchema.bill &&
        compiledRootSchema.pharmacy &&
        compiledRootSchema.MedicalRecord
    ) {
        console.log("✔ Root schema successfully imported and compiled all resources across clinical.auth and inventory.auth.");
    } else {
        throw new Error("❌ Multi-file import compilation failed.");
    }

    // Test 2: Resource Inheritance (patient extends MedicalRecord)
    console.log("\n2. Testing Single Resource Inheritance (patient extends MedicalRecord)...");
    console.log("Patient Resource Rules:", JSON.stringify(compiledRootSchema.patient, null, 2));

    if (compiledRootSchema.patient.delete && (compiledRootSchema.patient.delete as any).relation === "admin") {
        console.log("✔ 'patient' resource successfully inherited 'delete' permission from 'MedicalRecord'.");
    } else {
        throw new Error("❌ Resource inheritance failed: 'delete' permission not inherited.");
    }

    // Test 3: Circular Import Detection
    console.log("\n3. Testing Circular Import Detection...");
    const tmpDir = path.resolve("src/schema/_tmp_test");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const fileA = path.join(tmpDir, "A.auth");
    const fileB = path.join(tmpDir, "B.auth");

    fs.writeFileSync(fileA, `import "B.auth"\nsubject user\nresource resA { relation r1 : user }`);
    fs.writeFileSync(fileB, `import "A.auth"\nsubject user\nresource resB { relation r2 : user }`);

    try {
        compileAuthDSLFile(fileA);
        console.error("❌ Test Failed: Should have caught circular import A.auth -> B.auth -> A.auth.");
    } catch (err: any) {
        console.log("✔ Caught Circular Import Error:", err.message);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    // Test 4: Circular Inheritance Detection
    console.log("\n4. Testing Circular Inheritance Detection...");
    const circularInheritanceDSL = `
    subject user

    resource A extends B {
        relation r1 : user
        permission p1 = r1
    }

    resource B extends A {
        relation r2 : user
        permission p2 = r2
    }
    `;

    try {
        compileAuthDSL(circularInheritanceDSL);
        console.error("❌ Test Failed: Should have caught circular inheritance A -> B -> A.");
    } catch (err: any) {
        console.log("✔ Caught Circular Inheritance Error:", err.message);
    }

    // Test 5: Namespaces
    console.log("\n5. Testing Namespace Scope Resolution...");
    const namespaceDSL = `
    subject user

    namespace clinical {
        resource Patient {
            relation doctor_of : user
            permission view = doctor_of
        }
    }
    `;

    const compiledNamespaceSchema = compileAuthDSL(namespaceDSL);
    console.log("Compiled Namespace Schema Keys:", Object.keys(compiledNamespaceSchema));

    if (compiledNamespaceSchema["clinical::Patient"]) {
        console.log("✔ Resource inside namespace correctly scoped to 'clinical::Patient'.");
    } else {
        throw new Error("❌ Namespace resolution failed.");
    }

    console.log("\n=================================================");
    console.log("   V3.2 LANGUAGE FEATURES PASSED CLEANLY!       ");
    console.log("=================================================");
}

runV32LanguageTests();
