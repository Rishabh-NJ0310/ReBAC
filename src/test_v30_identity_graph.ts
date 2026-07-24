import { graphRepository } from "./authorization/GraphRepository.js";
import { authorizationService } from "./authorization/AuthorizationService.js";
import { compileAuthDSL } from "./compiler/CompilerFacade.js";

async function runV30IdentityGraphTests() {
    console.log("=================================================");
    console.log("   ReBAC V3.0 Identity Graph & Usersets Verification");
    console.log("=================================================\n");

    // Clean DB
    await graphRepository.deleteAll();

    // 1. Compile Schema with Subjects
    console.log("1. Compiling DSL Schema with Subject Declarations...");
    const dsl = `
    subject user
    subject group

    resource patient {
        relation doctor_of : group
        permission view = doctor_of
    }
    `;

    const compiledSchema = compileAuthDSL(dsl);
    console.log("Compiled V3.0 Schema:", JSON.stringify(compiledSchema, null, 2));

    // 2. Setup Data Model
    console.log("\n2. Creating Users, Groups, and Resources...");
    const raj = await graphRepository.createUser({
        name: "Raj",
        email: "raj@hospital.org",
        password: "pass"
    });

    const doctorsGroup = await graphRepository.createGroup("Doctors");
    const medicalStaffGroup = await graphRepository.createGroup("MedicalStaff");
    const hospitalStaffGroup = await graphRepository.createGroup("HospitalStaff");

    const patient101 = await graphRepository.createResource({
        type: "patient",
        name: "Patient101"
    });

    // 3. Build Identity Graph (Nested Group Memberships)
    console.log("\n3. Building Identity Graph (Nested Memberships)...");
    // Raj -> member -> Doctors
    await graphRepository.createRelationship({
        relation: "member",
        subjectId: raj.subjectId,
        targetSubjectId: doctorsGroup.subjectId
    });

    // Doctors -> member -> MedicalStaff
    await graphRepository.createRelationship({
        relation: "member",
        subjectId: doctorsGroup.subjectId,
        targetSubjectId: medicalStaffGroup.subjectId
    });

    // MedicalStaff -> member -> HospitalStaff
    await graphRepository.createRelationship({
        relation: "member",
        subjectId: medicalStaffGroup.subjectId,
        targetSubjectId: hospitalStaffGroup.subjectId
    });

    // 4. Assign Permission Edge to Top-Level Group
    console.log("\n4. Assigning 'doctor_of' relation from HospitalStaff group to Patient101...");
    await graphRepository.createRelationship({
        relation: "doctor_of",
        subjectId: hospitalStaffGroup.subjectId,
        objectId: patient101.id
    });

    // 5. Reachable Subject Resolution Verification
    console.log("\n5. Verifying Identity Graph Resolution (getReachableSubjectIds)...");
    const reachableIds = await graphRepository.getReachableSubjectIds(raj.subjectId);
    console.log(`Reachable Subject IDs for Raj (Subject #${raj.subjectId}):`, reachableIds);

    if (
        reachableIds.includes(raj.subjectId) &&
        reachableIds.includes(doctorsGroup.subjectId) &&
        reachableIds.includes(medicalStaffGroup.subjectId) &&
        reachableIds.includes(hospitalStaffGroup.subjectId)
    ) {
        console.log("✔ Nested Identity Graph transitively resolved all 4 subject nodes (Raj -> Doctors -> MedicalStaff -> HospitalStaff).");
    } else {
        throw new Error("❌ Identity Graph resolution failed.");
    }

    // 6. Dual-Graph Permission Check
    console.log("\n6. Running Dual-Graph Permission Check (Raj -> Patient101 -> view)...");
    const outcome = await authorizationService.checkPermission({
        userId: raj.id,
        resourceId: patient101.id,
        permission: "view"
    });

    console.log("Check Verdict:", outcome.allowed ? "ALLOWED" : "DENIED");
    console.log("Evaluation Trace:", outcome.trace);

    if (outcome.allowed) {
        console.log("\n=================================================");
        console.log("   V3.0 DUAL-GRAPH EVALUATION PASSED CLEANLY!    ");
        console.log("=================================================");
    } else {
        throw new Error("❌ V3.0 Dual-Graph Evaluation Failed.");
    }
}

runV30IdentityGraphTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
