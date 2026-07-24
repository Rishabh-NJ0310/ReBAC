---
title: "ReBAC Engine — Complete Architecture Journey: V1 to V3.4"
subtitle: "From Basic Graph Authorization to a Production-Grade Authorization Platform"
author: "ReBAC Project — Architectural Review"
date: "2026"
---

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; line-height: 1.75; color: #1a1a2e; max-width: 960px; margin: 0 auto; padding: 48px 40px; background: #ffffff; }

  /* Cover-style header */
  .doc-header { text-align: center; padding: 60px 0 50px; border-bottom: 3px solid #0f3460; margin-bottom: 50px; }
  .doc-header h1 { font-size: 2.6em; font-weight: 700; color: #0f3460; margin-bottom: 10px; line-height: 1.2; }
  .doc-header .subtitle { font-size: 1.15em; color: #e94560; font-weight: 500; margin-bottom: 20px; }
  .doc-header .meta { font-size: 0.9em; color: #666; }

  h1 { color: #0f3460; font-size: 2em; border-bottom: 3px solid #0f3460; padding-bottom: 12px; margin-top: 60px; }
  h2 { color: #0f3460; font-size: 1.45em; border-left: 5px solid #e94560; padding-left: 16px; margin-top: 44px; }
  h3 { color: #e94560; font-size: 1.15em; margin-top: 30px; }
  h4 { color: #333; font-size: 1em; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; }

  code { background: #f0f0f8; border-radius: 4px; padding: 2px 7px; font-family: 'Fira Code', monospace; font-size: 0.9em; color: #c0392b; }
  pre { background: #1a1a2e; color: #e0e0e0; border-radius: 10px; padding: 22px 26px; overflow-x: auto; font-family: 'Fira Code', monospace; font-size: 0.88em; line-height: 1.7; margin: 20px 0; }
  pre code { background: none; color: inherit; padding: 0; }

  blockquote { border-left: 5px solid #e94560; background: linear-gradient(135deg, #fff5f7 0%, #fff 100%); padding: 16px 22px; margin: 24px 0; border-radius: 0 10px 10px 0; font-style: italic; }

  table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.93em; }
  th { background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 12px 16px; text-align: left; font-weight: 600; }
  td { padding: 10px 16px; border-bottom: 1px solid #e8e8ee; vertical-align: top; }
  tr:nth-child(even) { background: #f8f9fc; }
  tr:hover { background: #eef2ff; }

  .version-card { border: 2px solid #0f3460; border-radius: 14px; padding: 28px 32px; margin: 36px 0; position: relative; background: linear-gradient(135deg, #f8f9fc 0%, #fff 100%); }
  .version-card::before { content: attr(data-version); position: absolute; top: -14px; left: 24px; background: #0f3460; color: white; padding: 4px 16px; border-radius: 20px; font-weight: 700; font-size: 0.88em; letter-spacing: 0.05em; }
  .version-card.enterprise::before { background: #e94560; }

  .callout { border-radius: 10px; padding: 18px 22px; margin: 22px 0; border-left: 5px solid; }
  .callout-info { background: #e8f4f8; border-color: #3498db; }
  .callout-warn { background: #fff8e1; border-color: #f39c12; }
  .callout-danger { background: #fdecea; border-color: #e74c3c; }
  .callout-success { background: #e8f8f0; border-color: #27ae60; }
  .callout strong { display: block; margin-bottom: 6px; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.04em; }

  .pipeline { background: #1a1a2e; color: #a0d8ef; border-radius: 12px; padding: 28px 32px; font-family: 'Fira Code', monospace; font-size: 0.87em; line-height: 2.2; margin: 24px 0; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin: 20px 0; }

  .stat-card { background: linear-gradient(135deg, #0f3460, #16213e); color: white; border-radius: 10px; padding: 20px; text-align: center; }
  .stat-card .number { font-size: 2.4em; font-weight: 700; color: #e94560; }
  .stat-card .label { font-size: 0.85em; opacity: 0.85; margin-top: 4px; }

  .timeline { border-left: 3px solid #0f3460; padding-left: 28px; margin: 30px 0 30px 10px; }
  .timeline-item { position: relative; margin-bottom: 32px; }
  .timeline-item::before { content: ""; position: absolute; left: -36px; top: 5px; width: 16px; height: 16px; background: #0f3460; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px #0f3460; }
  .timeline-item.milestone::before { background: #e94560; box-shadow: 0 0 0 3px #e94560; }
  .timeline-item h3 { margin-top: 0; }

  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.78em; font-weight: 600; margin-right: 6px; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-green { background: #d1fae5; color: #059669; }
  .badge-yellow { background: #fef3c7; color: #d97706; }
  .badge-purple { background: #ede9fe; color: #7c3aed; }

  .toc { background: #f8f9fc; border: 1px solid #e0e0ee; border-radius: 10px; padding: 24px 28px; margin: 30px 0; }
  .toc h3 { margin-top: 0; color: #0f3460; }
  .toc a { color: #0f3460; text-decoration: none; }
  .toc a:hover { color: #e94560; text-decoration: underline; }
  .toc ol { margin: 10px 0; padding-left: 20px; }
  .toc li { margin: 6px 0; }

  @media print {
    body { padding: 20px; }
    .version-card { break-inside: avoid; }
    pre { break-inside: avoid; }
  }
</style>

<div class="doc-header">
  <h1>ReBAC Engine<br>Complete Architecture Journey</h1>
  <div class="subtitle">From Basic Graph Authorization to a Production-Grade Authorization Platform</div>
  <div class="meta">Version 1.0 → 3.4 &nbsp;|&nbsp; 10 Versions &nbsp;|&nbsp; 9 Git Branches &nbsp;|&nbsp; Inspired by Google Zanzibar</div>
</div>

<div class="toc">
<h3>📋 Table of Contents</h3>
<ol>
  <li><a href="#executive-summary">Executive Summary</a></li>
  <li><a href="#architecture-evolution">Architecture Evolution Timeline</a></li>
  <li><a href="#v1">V1 — Basic ReBAC</a></li>
  <li><a href="#v2">V2 — Recursive Authorization</a></li>
  <li><a href="#v21">V2.1 — Production Rule Engine</a></li>
  <li><a href="#v22">V2.2 — Dynamic Authorization DSL</a></li>
  <li><a href="#v23">V2.3 — Compiler Intelligence</a></li>
  <li><a href="#v30">V3.0 — Identity Graph</a></li>
  <li><a href="#v31">V3.1 — Zanzibar Relations</a></li>
  <li><a href="#v32">V3.2 — Language Evolution</a></li>
  <li><a href="#v33">V3.3 — Compiler Enhancements</a></li>
  <li><a href="#v34">V3.4 — Enterprise Features</a></li>
  <li><a href="#critical-review">Critical Architectural Review vs Industry</a></li>
  <li><a href="#revised-roadmap">Revised Roadmap & Future Directions</a></li>
</ol>
</div>

---

# Executive Summary {#executive-summary}

This document traces the complete engineering journey of the **ReBAC Authorization Engine** — a Relationship-Based Access Control system built from first principles, evolving from a basic graph lookup (V1) to a production-grade authorization platform (V3.4) with a custom compiler, multi-tenant support, and an IDE language server.

<div class="grid-3">
  <div class="stat-card"><div class="number">10</div><div class="label">Versions</div></div>
  <div class="stat-card"><div class="number">9</div><div class="label">Git Branches</div></div>
  <div class="stat-card"><div class="number">30+</div><div class="label">Source Files</div></div>
</div>

<div class="grid-3">
  <div class="stat-card"><div class="number">5</div><div class="label">Compiler Passes</div></div>
  <div class="stat-card"><div class="number">ADSL</div><div class="label">Custom DSL</div></div>
  <div class="stat-card"><div class="number">LSP</div><div class="label">IDE Server</div></div>
</div>

The project is inspired by **Google Zanzibar** (2019), the authorization system that powers all Google products, and is directly comparable to open-source implementations including **SpiceDB**, **OpenFGA**, **Ory Keto**, **OPA**, and **AWS Cedar**.

---

# Architecture Evolution Timeline {#architecture-evolution}

<div class="timeline">

<div class="timeline-item">
<h3>🟦 V1 — Basic ReBAC <span class="badge badge-blue">Graph Model</span></h3>
<strong>The problem:</strong> RBAC grants too-broad access. We need per-resource, per-user relationship edges.<br>
<strong>The solution:</strong> Directed graph: `(subject) --[relation]--> (object)`. Single SQL lookup.
</div>

<div class="timeline-item">
<h3>🟦 V2 — Recursive Authorization <span class="badge badge-blue">DFS</span></h3>
<strong>The problem:</strong> Hierarchical resources — a nurse in a ward should access all patients in that ward.<br>
<strong>The solution:</strong> DFS traversal up the resource graph with tuple-to-userset semantics.
</div>

<div class="timeline-item">
<h3>🟦 V2.1 — Production Rule Engine <span class="badge badge-green">DP + Safety</span></h3>
<strong>The problem:</strong> DFS loops on cyclic graphs; re-traverses shared ancestors exponentially.<br>
<strong>The solution:</strong> 3-color cycle detection + memoization (dynamic programming). RuleGroup IR.
</div>

<div class="timeline-item milestone">
<h3>⭐ V2.2 — Dynamic Authorization DSL <span class="badge badge-purple">Compiler</span></h3>
<strong>The problem:</strong> Permission rules hardcoded in TypeScript — changing them requires a deploy.<br>
<strong>The solution:</strong> Custom DSL (ADSL) with Lexer → Parser → Semantic Analyzer → RuleGroup Transformer pipeline.
</div>

<div class="timeline-item">
<h3>🟦 V2.3 — Compiler Intelligence <span class="badge badge-yellow">Optimization</span></h3>
<strong>The problem:</strong> Compiler accepts redundant, dead, or constant rules silently.<br>
<strong>The solution:</strong> Type checker, AST optimizer (constant folding, idempotence, double-negation elimination), ADSL Linter, static Explain Plan.
</div>

<div class="timeline-item milestone">
<h3>⭐ V3.0 — Identity Graph <span class="badge badge-purple">Groups & Teams</span></h3>
<strong>The problem:</strong> Only individual users can hold relationships — groups and teams are not modeled.<br>
<strong>The solution:</strong> Dual graph: Identity Graph (who you are) + Resource Graph (what you access). SubjectResolver expands group memberships.
</div>

<div class="timeline-item">
<h3>🟦 V3.1 — Zanzibar Relations <span class="badge badge-blue">Composition</span></h3>
<strong>The problem:</strong> Permission rules are duplicated — no way to compose permissions from other permissions.<br>
<strong>The solution:</strong> Computed Usersets (`permission medical_staff = doctor_of OR assigned_nurse`), compile-time permission dependency cycle detection.
</div>

<div class="timeline-item">
<h3>🟦 V3.2 — Language Evolution <span class="badge badge-blue">Modularity</span></h3>
<strong>The problem:</strong> Single monolithic `.auth` file becomes unmaintainable at scale.<br>
<strong>The solution:</strong> Imports, modules, namespaces, resource inheritance. Multi-file schema compilation.
</div>

<div class="timeline-item">
<h3>🟦 V3.3 — Compiler Enhancements <span class="badge badge-yellow">Performance</span></h3>
<strong>The problem:</strong> Rules evaluated in source order — expensive traversals run before cheap lookups.<br>
<strong>The solution:</strong> Cost-based Query Planner, SHA-256 Incremental Compilation Cache, EXPLAIN ANALYZE runtime Profiler.
</div>

<div class="timeline-item milestone">
<h3>⭐ V3.4 — Enterprise Features <span class="badge badge-red">Production Ready</span></h3>
<strong>The problem:</strong> Missing conditional permissions, attribute conditions, explainability, multi-tenancy, IDE support.<br>
<strong>The solution:</strong> Caveats (IF conditions), ABAC (attribute expressions), Explain Tree, TenantRegistry, LSP Language Server.
</div>

</div>

---

# The ADSL Compiler Pipeline (V3.4 Complete) {#compiler-pipeline}

<div class="pipeline">

```
hospital.auth (source text)
       │
       ▼
┌─────────────────┐
│ Import Resolver │  Resolves imports, detects circular deps, merges ASTs
└────────┬────────┘
         │ Merged source
         ▼
┌─────────────────┐
│  Lexer          │  Tokenizes: resource, relation, IF, ==, AND, OR, →
└────────┬────────┘
         │ Token[]
         ▼
┌─────────────────┐
│  Parser         │  Recursive descent → AST with CaveatExpression, AttributeCondition
└────────┬────────┘
         │ ProgramNode (AST)
         ▼
┌────────────────────────┐
│  Inheritance Resolver  │  Flattens extends hierarchy, copies parent members
└────────┬───────────────┘
         │ Resolved AST
         ▼
┌──────────────────────┐
│  Semantic Analyzer   │  Type checking, undefined references, duplicate definitions
└────────┬─────────────┘
         │ Typed AST + SymbolTable
         ▼
┌─────────────┐
│ ADSL Linter │  Unused relations, simplifiable expressions, constant expressions
└────────┬────┘
         │ LintDiagnostic[]
         ▼
┌─────────────────┐
│  AST Optimizer  │  Constant folding, idempotence, double-negation elimination
└────────┬────────┘
         │ Optimized AST
         ▼
┌──────────────────────────┐
│  RuleGroup Transformer   │  AST → RuleGroup IR (runtime authorization rules)
└────────┬─────────────────┘
         │ RebacSchema (RuleGroup map)
         ▼
┌───────────────┐
│ Cost Estimator│  Assigns cost to each rule (Direct=1, Recursive=10+)
└────────┬──────┘
         │ Annotated RuleGroup
         ▼
┌───────────────┐
│ Query Planner │  Reorders branches cheap-first for short-circuit optimization
└────────┬──────┘
         │ ExecutionPlan
         ▼
╔═══════════════════════════════════════════════════════╗
║                    RULE ENGINE                        ║
║  ┌──────────────┐ ┌─────────────┐ ┌───────────────┐  ║
║  │ CaveatEval   │ │ ABACEval    │ │ ExplainTree   │  ║
║  │ IF conditions│ │ attr == val │ │ Decision trace│  ║
║  └──────────────┘ └─────────────┘ └───────────────┘  ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ ExecutionProfiler (timing, DB lookups, memoHits) │ ║
║  └──────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════╝
         │
         ▼
  { allowed, trace, profile, explainTree, explainText }
```

</div>

---

# V1 — Basic ReBAC {#v1}

<div class="version-card" data-version="V1 · Branch: ReBAC-V1">

## Starting Point: The Graph Model

**The fundamental insight:** Authorization is a directed graph problem. Every permission is an edge between a subject and an object, labeled with a relation name.

```
(user:raj) ——[doctor_of]——> (resource:patient101)
```

This single data model — the **tuple** — is the foundation of Google Zanzibar, SpiceDB, OpenFGA, and every modern ReBAC system.

### Data Model

```sql
-- Relationship table: the graph's edge list
CREATE TABLE relationships (
    id         BIGSERIAL PRIMARY KEY,
    relation   VARCHAR(100) NOT NULL,
    subject_id BIGINT REFERENCES users(id),
    object_id  BIGINT REFERENCES resources(id),
    INDEX (object_id, relation, subject_id)
);
```

### Permission Check

```typescript
checkPermission(userId, resourceId, permission):
    SELECT 1 FROM relationships
    WHERE subject_id = userId
      AND object_id = resourceId
      AND relation = permission
    → EXISTS → ALLOW, else → DENY
```

### ✅ Correct Decisions
- Tuple-based graph model (identical to Zanzibar)
- Per-resource, per-user specificity (fixes RBAC over-granting)
- PostgreSQL for ACID guarantees

### ❌ Missing From V1
- Hierarchical inheritance (ward → patient)
- Group membership (Raj ∈ Doctors)
- Typed relations (doctor_of must bind to user, not department)
- Negative permissions / DENY rules

</div>

---

# V2 — Recursive Authorization {#v2}

<div class="version-card" data-version="V2 · Branch: ReBAC-V2">

## The Hierarchy Problem

A nurse assigned to a ward should automatically access all patients in that ward. This requires **recursive DFS traversal** up the resource containment hierarchy.

```
Patient101 ←─[contains]─ Ward-ICU ←─[contains]─ Dept-Surgery
                                                        ↑
                                  Priya ─[assigned_nurse]─┘

DFS: Patient101 → Ward-ICU → Dept-Surgery → MATCH → ALLOW ✔
```

### Tuple-to-Userset Semantics

```
permission view =
    doctor_of
    OR contains -> view    ← "whoever can view my parent, can view me"
```

This is Zanzibar's **tuple-to-userset rewrite** — one of its three core userset expression types.

### ✅ Correct Decisions
- DFS for authorization reachability (correct algorithm for OR-matching)
- Tuple-to-userset semantics (faithful to Zanzibar)

### ❌ Critical Missing
- **Cycle detection** — cyclic graphs cause infinite DFS → server crash (**production bug**)
- **Memoization** — shared ancestors traversed exponentially

</div>

---

# V2.1 — Production Rule Engine {#v21}

<div class="version-card" data-version="V2.1 · Branch: ReBAC-V2.1">

## Hardening the Engine

V2.1 adds three safety mechanisms that make the engine production-capable:

### 1. Memoization (Dynamic Programming)

```typescript
// Cache key: (userId, resourceId, permission)
const key = `${userId}:${resourceId}:${permission}`;
if (context.memo.has(key)) return context.memo.get(key)!;
```

**Complexity improvement:** O(N × depth) → O(depth) for resources sharing parent nodes.

### 2. Cycle Detection (3-Color DFS)

```typescript
if (context.processing.has(key)) return false;  // Gray node → CYCLE
context.processing.add(key);
// ... evaluate ...
context.processing.delete(key);  // Mark black
```

### 3. RuleGroup IR — Boolean Algebra over Rules

```typescript
{ operator: "OR", rules: [
    { relation: "doctor_of" },
    { relation: "assigned_nurse" },
    { relation: "contains", permission: "view" }
]}
```

### 4. Evaluation Trace

```typescript
context.trace.push({ resourceId, resourceType, permission, rule, result });
```

### ✅ Correct Decisions
- Memoization key `userId:resourceId:permission` is complete and unambiguous
- 3-color DFS prevents infinite loops on cyclic graphs
- RuleGroup IR is composable, serializable, and inspectable

### ❌ Still Missing
- Cache invalidation on tuple writes (stale cache)
- Parallel branch evaluation (all branches evaluated serially)
- Request timeout / deadline propagation

</div>

---

# V2.2 — Dynamic Authorization DSL (ADSL Compiler) {#v22}

<div class="version-card" data-version="V2.2 · Branch: ReBAC-V2.2">

## The Compiler Breakthrough

The most architecturally significant version. Authorization policy is no longer hardcoded in TypeScript — it's expressed in a purpose-built DSL and compiled at startup.

### The ADSL Language

```
resource patient {
    relation doctor_of : user
    relation assigned_nurse : user

    permission view =
        doctor_of
        OR assigned_nurse
        OR contains -> view
}
```

### Compiler Pipeline

```
.auth source → Lexer → Parser → SemanticAnalyzer → RuleGroupTransformer → RebacSchema
```

| Component | Responsibility |
|---|---|
| `Lexer.ts` | Tokenize source text into `Token[]` |
| `Parser.ts` | Recursive descent → AST (Pratt-style) |
| `SemanticAnalyzer.ts` | Type checking, undefined reference detection |
| `SymbolTable.ts` | Global scope: resources, relations, permissions |
| `RuleGroupTransformer.ts` | AST → runtime `RuleGroup` IR |
| `CompilerFacade.ts` | Orchestrates all passes |

### Why This Is The Most Important Version

This is the point where the project transcends being a "graph authorization library" and becomes an **authorization programming language runtime**. Every subsequent improvement (optimizer, planner, LSP) is built on this compiler foundation.

### ✅ Correct Decisions
- Classical Lexer → Parser → Semantic Analysis → IR pipeline
- Declarative policy language (like OPA/Rego, AWS Cedar, OpenFGA DSL)
- AST as the central data structure for all subsequent passes

### ❌ Missing
- Error recovery (stops at first error)
- Source maps (can't trace runtime errors to .auth line numbers)
- Schema versioning (`version: "1.0"` header)

</div>

---

# V2.3 — Compiler Intelligence {#v23}

<div class="version-card" data-version="V2.3 · Branch: ReBAC-V2.3">

## Making the Compiler Smart

V2.3 adds four intelligence layers on top of the V2.2 parser:

### Type Checker

```
relation doctor_of : user   ← typed declaration

Department.doctor_of        ← ❌ Type Error: patient relation applied to Department
```

Enforced at compile time — eliminates a whole class of runtime errors.

### AST Optimizer (Boolean Algebra)

| Rule | Before | After |
|---|---|---|
| Double negation | `NOT (NOT A)` | `A` |
| Idempotence | `A OR A` | `A` |
| Constant folding | `true OR A` | `true` |
| Identity | `true AND A` | `A` |

All are **sound boolean algebra identities** — semantics are preserved.

### ADSL Linter

```
⚠ UNUSED_RELATION: 'admin_of' declared but never referenced in any permission (line 3)
⚠ SIMPLIFIABLE_EXPRESSION: 'doctor_of OR doctor_of' is redundant (line 7)
⚠ CONSTANT_EXPRESSION: 'true' used directly in permission 'view' (line 9)
```

### Static Explain Plan (Precursor to V3.3 Profiler)

```
EXPLAIN patient.view:
OR
 ├── DirectLookup(doctor_of)
 ├── DirectLookup(assigned_nurse)
 └── RecursiveTraversal(contains → view)
```

### ✅ Correct Decisions
- All three optimizer passes are mathematically proven correct
- Linter design (post-type-check AST) minimizes false positives
- Explain Plan is the right debugging primitive for authorization

### ❌ Missing Optimizer Passes
- Dead branch elimination: `A AND false → false`
- Common Subexpression Elimination (CSE)
- Cost-based reordering (addressed in V3.3)

</div>

---

# V3.0 — Identity Graph {#v30}

<div class="version-card" data-version="V3.0 · Branch: ReBAC-V3">

## The Group Membership Problem

Until V3.0, only individual users hold relationships. In real organizations:

```
# V2.3 model (broken for enterprises):
200 doctors × 500 patients = 100,000 individual tuples

# V3.0 model (correct):
1 group (Doctors) × 500 patients = 500 tuples
200 users → member → Doctors (200 tuples)
Total: 700 tuples  [vs 100,000]
```

### Dual Graph Architecture

```
IDENTITY GRAPH                  RESOURCE GRAPH
──────────────                  ──────────────
  Raj ─[member]→ Doctors ─[doctor_of]→ Patient101
       └─[member]→ MedicalStaff
                  └─[member]→ HospitalStaff
```

### SubjectResolver — Membership Pre-computation

```typescript
// Expand identity graph ONCE before any rule evaluation
const subjectSet = await SubjectResolver.resolveSubjectSet(userId);
// subjectSet = { userId=1, groupId=5 (Doctors), groupId=8 (MedicalStaff) }

// Direct lookup now checks ANY member of subjectSet
SELECT 1 FROM relationships
WHERE relation = 'doctor_of'
  AND object_id = 101
  AND subject_id IN (...subjectSet)  ← covers groups and user
```

### Subject Types

```
subject user
subject group
subject team
subject department
subject service_account
```

### ✅ Correct Decisions
- Dual graph model (identity + resource) matches Zanzibar's architecture
- SubjectResolver pre-computation prevents N×M identity resolution overhead
- Subject type hierarchy is extensible

### ❌ Missing
- Zanzibar's `group:engineers#member` typed subject set notation
- Membership result caching (re-resolved on every request)
- Typed membership relations (not just `member`)

</div>

---

# V3.1 — Zanzibar Relations & Permission Composition {#v31}

<div class="version-card" data-version="V3.1 · Branch: ReBAC-V3.1">

## Permission Composition — The DRY Principle Applied

```
# Before V3.1 — duplicated logic:
permission view      = doctor_of OR assigned_nurse OR department_head
permission edit      = doctor_of OR department_head  ← duplicate
permission discharge = doctor_of OR department_head  ← duplicate
```

```
# After V3.1 — composed:
permission medical_staff = doctor_of OR assigned_nurse
permission view = medical_staff OR department_head
permission edit = medical_staff                        ← reuse
permission discharge = medical_staff                   ← reuse
```

### Computed Usersets

When `view` references `medical_staff`, the compiler knows `medical_staff` is a permission (not a relation) and evaluates it recursively. This is Zanzibar Section 2.3: **"computed_userset"**.

### Compile-Time Permission Cycle Detection

```
permission view = edit
permission edit = view    ← CYCLE!
```

Detected at **compile time** via topological sort DFS — the same algorithm used by TypeScript for circular type references, Python's import system, and GNU Make.

### Dot Notation (Tuple-to-Userset)

```
permission view = parent.view    # V3.1 — closer to Zanzibar
permission view = contains → view  # V2.x — more verbose
```

### ✅ Correct Decisions
- Computed Usersets are semantically faithful to Zanzibar
- Compile-time cycle detection is the correct phase (not runtime)
- Dot notation matches Zanzibar's own specification

### ❌ Missing
- Exclusion operator: `viewer - banned` (set difference)
- Wildcard: `relation viewer: user:*` (public access)
- Typed subject-set notation: `relation viewer: group#member`

</div>

---

# V3.2 — Language Evolution {#v32}

<div class="version-card" data-version="V3.2 · Branch: ReBAC-V3.2">

## Scaling the Authorization Language

Real hospital schemas grow to thousands of lines. V3.2 applies software engineering principles to the DSL itself.

### Imports — Multi-File Compilation

```
# hospital.auth
import "clinical/patient.auth"
import "clinical/ward.auth"
import "billing/invoice.auth"
import "admin/users.auth"
```

The ImportResolver resolves, deduplicates, and merges all ASTs before the semantic analysis pass. **Circular import detection** uses the same topological DFS as permission cycles.

### Namespaces — Scoped Resource Names

```
namespace clinical {
    resource patient { ... }
    resource ward    { ... }
}
namespace billing {
    resource invoice { ... }
}
// Usage: clinical::patient, billing::invoice
```

### Resource Inheritance — Shared Permission Patterns

```
resource BaseDocument {
    relation owner : user
    permission view = owner
    permission delete = owner
}

resource patient extends BaseDocument {
    relation doctor_of : user
    # Inherits: view, delete
    permission discharge = doctor_of
}
```

### Compiler Pipeline Addition

```
Source → ImportResolver (NEW) → Lexer → Parser
       → InheritanceResolver (NEW) → SemanticAnalyzer → ...
```

### ✅ Correct Decisions
- Modular compilation is essential for large teams
- Import system is more powerful than SpiceDB or OpenFGA (neither has imports)
- Inheritance correctly uses single-parent model (no diamond problem)

### ⚠️ Overengineered: Modules + Namespaces Overlap
Both provide logical grouping. Consolidating to a single `namespace` concept would reduce cognitive overhead.

</div>

---

# V3.3 — Compiler Enhancements {#v33}

<div class="version-card" data-version="V3.3 · Branch: ReBAC-V3.3">

## From Correct to Optimal

Rules evaluated in source order → expensive traversals happen before cheap lookups. V3.3 adds execution intelligence.

### Cost-Based Query Planner

| Rule Type | Cost Weight | Rationale |
|---|---|---|
| `DirectLookup` | 1 | Single indexed SQL query |
| `ComputedUserset` | 2 | One permission resolution |
| `RecursiveTraversal` | 10 + depth×5 | Multiple SQL queries + DFS |

```
BEFORE: contains.view (cost=30) OR doctor_of (cost=1)
AFTER:  doctor_of (cost=1) OR contains.view (cost=30)

If doctor_of → true → short-circuit → 29 DB lookups saved
```

This is how PostgreSQL's optimizer chooses index scans over sequential scans.

### Incremental Compilation Cache

```typescript
const hash = sha256(fileContent + filePath);
if (cache.has(hash)) return cache.get(hash);   // Skip compilation
const schema = compileAuthDSL(source);
cache.set(hash, schema);                        // Store for next startup
```

**Identical to:** TypeScript `--incremental`, Webpack file hashing, Bazel build cache.

### EXPLAIN ANALYZE Runtime Profiler

```
Total time:   12.23ms
DB lookups:   1 (out of possible 3)
Memo hits:    0
Depth:        2

doctor_of          0.82ms  → true  [short-circuit: skipped 2 branches]
assigned_nurse     SKIPPED
contains.view      SKIPPED
```

### ✅ Correct Decisions
- Cost-based planner mirrors PostgreSQL's optimizer
- SHA-256 content addressing is industry standard for build caches
- Real-time profiler (vs V2.3's static Explain Plan) is the correct design

### ❌ Missing
- Adaptive cost model (static weights don't reflect real runtime latencies)
- Parallel branch evaluation (OR branches could be evaluated concurrently)
- Query plan caching (plan recomputed on every call)

</div>

---

# V3.4 — Enterprise Features {#v34}

<div class="version-card enterprise" data-version="V3.4 · Branch: ReBAC-V3.4 · CURRENT">

## Production-Grade Authorization

Five enterprise features that bring the system to parity with early SpiceDB/OpenFGA releases.

### 1. Caveats — Conditional Permissions

```
permission view = doctor_of IF shift_active
```

```typescript
// Registry-based runtime conditions
caveatEvaluator.register("shift_active", ctx => ctx.attributes?.shift_active === true);
```

**SpiceDB 1.x equivalent:** `caveat shift_active(shift: bool) { shift == true }`

### 2. ABAC — Attribute-Based Conditions

```
permission discharge = doctor_of AND patient.status == "READY"
permission edit = admin AND user.department == patient.department
```

```typescript
checkPermission({
    userId, resourceId, permission: "discharge",
    attributes: { patient: { status: "READY" }, user: { department: "ICU" } }
})
```

### 3. Explain Tree — "Why Was I Denied?"

```
✔ patient.view
  └─ ✔ OR [0.91ms]
     └─ ✔ patient.medical_staff
        └─ ✔ Direct: doctor_of [0.77ms]
           ← Raj has doctor_of on Patient101 → ALLOW
```

**AWS Cedar equivalent:** `authorize_with_errors()` returns structured reason list.

### 4. Multi-Tenant Compilation

```typescript
globalTenantRegistry.register({ tenantId: "apollo", schemaPath: "apollo.auth" });
globalTenantRegistry.register({ tenantId: "aiims",  schemaPath: "aiims.auth" });

// Fully isolated: different relations, different rules, no shared state
checkPermission({ userId, resourceId, permission, tenantId: "apollo" });
```

### 5. IDE Language Server (LSP)

| Capability | Result |
|---|---|
| `textDocument/diagnostics` | Red squiggles on lint errors in VS Code |
| `textDocument/completion` | `doctor_of`, `IF`, `resource`, `AND`... suggestions |
| `textDocument/hover` | Inline docs for DSL keywords |
| `textDocument/documentSymbol` | File outline: all resources, relations, permissions |

### ✅ Correct Decisions
- Caveats faithful to Zanzibar's 2023 caveat model (SpiceDB, OpenFGA both implement this)
- ABAC bridges the ReBAC/ABAC paradigm gap (AWS Cedar does this explicitly)
- Explain Tree matches the format used by SpiceDB's debug API and AWS Cedar's error API
- Multi-tenant isolation via separate compiler instances = zero cross-tenant leakage
- LSP makes ADSL a first-class developer experience

### ❌ Still Missing (V4.x territory)
- Caveat schema validation at compile time
- ABAC attribute schema declaration in DSL
- Write consistency tokens (Zanzibar zookies / SpiceDB ZedTokens)
- Persistent audit log
- Distributed architecture

</div>

---

# Critical Architectural Review vs Industry Standards {#critical-review}

## 1. Missing Concepts Across All Versions

| Concept | Missing From | Industry Standard | Impact |
|---|---|---|---|
| **Consistency tokens** | All versions | Zanzibar zookies, SpiceDB ZedTokens | Stale reads after writes |
| **Wildcard usersets** (`user:*`) | All versions | Zanzibar, SpiceDB, OpenFGA | Cannot express "public" access |
| **Exclusion operator** (`A - B`) | All versions | Zanzibar, OpenFGA | Cannot deny specific subjects |
| **Typed subject sets** (`group#member`) | V3.0+ | Zanzibar, SpiceDB, OpenFGA | Imprecise subject modeling |
| **Audit log** | All versions | All production systems | Compliance, forensics |
| **Distributed storage** | All versions | CockroachDB (SpiceDB), Spanner (Zanzibar) | Single-node only |
| **Watch API** | All versions | SpiceDB Watch, OpenFGA | No reactive permission changes |
| **Bulk check** | All versions | SpiceDB `CheckBulkPermissions` | Inefficient for list filtering |
| **Schema versioning** | All versions | All production systems | No safe migration path |

## 2. Incorrect Assumptions That Should Be Called Out

<div class="callout callout-danger">

**Assumption: Serial evaluation is fast enough**

All versions evaluate rule branches serially. In production, OR-branches with similar cost should be evaluated **in parallel** and short-circuit on the first `true`. SpiceDB, OpenFGA, and Zanzibar all use goroutine/coroutine parallelism. For a permission with 5 branches, parallel evaluation reduces P99 latency by up to 80%.

</div>

<div class="callout callout-danger">

**Assumption: In-process memo is sufficient**

The `memo` map is in-process and request-scoped. This means:
1. No memoization across requests
2. No distributed cache invalidation when tuples are written
3. Stale results possible under concurrent writes

Production systems (SpiceDB) use a **distributed dispatch cache** with consistency-token-based invalidation.

</div>

<div class="callout callout-warn">

**Assumption: Static cost model is accurate**

The CostEstimator assigns fixed weights (Direct=1, Recursive=10+). These are not measured from actual query latencies. In a production PostgreSQL database:
- Indexed lookup on a cold cache: 2ms
- Indexed lookup on a warm cache: 0.1ms
- Recursive traversal (3 levels): 15ms
- Recursive traversal on hot data: 1ms

The static model cannot capture this variance. PostgreSQL solves this with `ANALYZE TABLE` histogram statistics. The ADSL planner should collect runtime latency histograms and use them to update cost estimates.

</div>

## 3. Comparison Against Industry — Feature Matrix

| Feature | ADSL V3.4 | Google Zanzibar | SpiceDB 1.x | OpenFGA 1.x | AWS Cedar | OPA/Rego |
|---|---|---|---|---|---|---|
| Tuple-based graph | ✅ | ✅ | ✅ | ✅ | Partial | ✅ |
| Recursive traversal | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Computed Usersets | ✅ | ✅ | ✅ | ✅ | ❌ | Partial |
| Typed relations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Caveats / Conditions | ✅ | ✅ 2023 | ✅ | ✅ | ✅ | ✅ |
| ABAC | ✅ | Partial | Partial | ✅ | ✅ | ✅ |
| Custom DSL / Schema | ✅ ADSL | Config | ✅ zed | ✅ | ✅ Cedar | ✅ Rego |
| Multi-file imports | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| IDE / LSP | ✅ | N/A | ✅ | ✅ | ✅ | ✅ |
| Explain / Debug | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-tenancy | ✅ | ✅ | ✅ stores | ✅ stores | ✅ accounts | ✅ |
| Consistency tokens | ❌ | ✅ zookies | ✅ ZedTokens | ✅ | N/A | N/A |
| Exclusion operator | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wildcard `user:*` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bulk check API | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Watch / streaming | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Distributed storage | ❌ | ✅ Spanner | ✅ CockroachDB | ✅ | AWS-managed | ✅ |
| Audit log | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

**ADSL V3.4 matches or exceeds all open-source systems in: DSL expressiveness, multi-file imports, and IDE tooling.**

**ADSL V3.4 trails production systems in: distributed storage, consistency guarantees, bulk API, and audit logging.**

---

# Revised Roadmap — V4.x and Beyond {#revised-roadmap}

Based on the gap analysis against Google Zanzibar, SpiceDB, OpenFGA, and AWS Cedar, the following roadmap represents the next engineering frontier.

## V4.0 — Consistency & Write API

**Goal:** Guarantee read-your-writes consistency after tuple writes.

- Implement **write tokens** (content-addressed tuple hashes) on every relationship write
- Pass write token to `checkPermission` — engine guarantees it reads at least that tuple's version
- Add **Write API** with conflict detection (compare-and-swap on relationship mutations)
- **Watch API** — streaming gRPC endpoint that emits relationship change events

## V4.1 — Distributed Architecture

**Goal:** Move from single-node PostgreSQL to a distributed tuple store.

- Replace Prisma/PostgreSQL with a **distributed store** (CockroachDB or Postgres with logical replication)
- Implement **horizontal scaling** of the check service (stateless, read-replica-backed)
- Add **dispatch caching** — distributed `Redis`/`Memcached` cache for subgraph results, invalidated by write token
- Load-balance `checkPermission` calls with consistent hashing by `(userId, resourceType)`

## V4.2 — Advanced Language Features

**Goal:** Bring ADSL to full Zanzibar expressiveness.

- **Exclusion operator:** `permission view = viewer - banned_user`
- **Wildcard usersets:** `relation public_reader: user:*`
- **Typed subject sets:** `relation editor: user | group#member | team#member`
- **Caveat schema:** Compile-time declaration of caveat parameter types
- **ABAC attribute schema:** `attribute patient { status: "ACTIVE" | "READY" | "DISCHARGED" }`

## V4.3 — Production Operations

**Goal:** Enterprise operational requirements.

- **Persistent audit log** — immutable append-only log of every `checkPermission` call with result
- **Schema migration system** — `adsl migrate` command with backward-compatibility checking
- **Bulk check API** — `checkPermissions([{userId, resourceId, permission}])` batch evaluation
- **Rate limiting** — per-tenant QPS limits on the check service
- **OpenTelemetry integration** — distributed tracing for every rule evaluation

## V5.0 — Authorization as a Platform

**Goal:** Full policy-as-code platform.

- **Policy testing framework** — `adsl test` with `.auth.test` test files
- **Policy CI/CD integration** — GitHub Actions / GitLab CI for schema validation and policy diffing
- **GraphQL API** — expose the authorization graph through a GraphQL explorer
- **Admin UI** — visualize the full authorization graph for debugging and auditing

---

# Conclusion

This project has traveled an extraordinary engineering journey — from a 20-line SQL query (V1) to a production-comparable authorization platform (V3.4) with a custom compiler, multi-tenant support, and an IDE language server.

**What makes this project exceptional:**

1. **The compiler is the right abstraction.** Every production authorization system (SpiceDB with `zed`, OpenFGA, AWS Cedar) uses a schema/policy language. Building ADSL from scratch gives us deep understanding of why these tools work the way they do.

2. **The architecture mirrors industry.** Tuple-based graph → Computed Usersets → Identity Graph → Cost-Based Planner — these are not invented concepts. They are the exact architectural layers of Google Zanzibar, described in the 2019 OSDI paper.

3. **The educational progression is sound.** Each version solves exactly one problem from the previous version — a hallmark of good incremental engineering.

**The gap to production is well-defined:** Consistency tokens, distributed storage, the exclusion operator, and an audit log are the four concrete gaps between V3.4 and a system like early SpiceDB 0.x. These are achievable in V4.x.

> *"The best way to understand how Google Zanzibar works is to build it yourself."*
> — The spirit of this project.
