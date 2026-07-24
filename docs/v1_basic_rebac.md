---
title: "ReBAC V1 — Basic Relationship-Based Access Control"
version: "1.0"
branch: "ReBAC-V1"
---

<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; color: #1a1a2e; max-width: 900px; margin: 0 auto; padding: 40px; }
  h1 { color: #16213e; border-bottom: 4px solid #0f3460; padding-bottom: 12px; font-size: 2.2em; }
  h2 { color: #0f3460; border-left: 5px solid #e94560; padding-left: 14px; margin-top: 40px; }
  h3 { color: #e94560; margin-top: 28px; }
  code, pre { background: #f4f4f8; border-radius: 6px; font-family: 'Fira Code', monospace; }
  pre { padding: 16px; border-left: 4px solid #0f3460; overflow-x: auto; }
  blockquote { border-left: 4px solid #e94560; background: #fff5f7; padding: 12px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #0f3460; color: white; padding: 10px 14px; text-align: left; }
  td { padding: 9px 14px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) { background: #f8f9fa; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.78em; font-weight: bold; }
  .badge-green { background: #d4edda; color: #155724; }
  .badge-red { background: #f8d7da; color: #721c24; }
  .badge-yellow { background: #fff3cd; color: #856404; }
  .callout { background: #e8f4f8; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .callout-warn { background: #fff8e1; border-color: #ffc107; }
  .callout-danger { background: #fdecea; border-color: #f44336; }
</style>

# ReBAC V1 — Basic Relationship-Based Access Control

> **Branch:** `ReBAC-V1` &nbsp;|&nbsp; **Purpose:** Establish the foundational graph model

---

## The Problem This Version Solves

Traditional Role-Based Access Control (RBAC) assigns permissions to roles and roles to users. This breaks down in healthcare, multi-tenant SaaS, and any domain where **who can access what depends on the relationship between the subject and the object**, not just the subject's role.

**Example failure of RBAC:**
```
ROLE: doctor
CAN: view patients
```
This grants Dr. Raj access to **all** patients — not just his own. That is a security violation.

**What we need:**
```
Raj ——[doctor_of]——> Patient101   ✔ Allowed
Raj ——[doctor_of]——> Patient202?  ✘ No relationship → Denied
```

The permission is encoded in the **edge** of a directed graph, not in a role table.

---

## Version 1 Architecture

### Core Data Model

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │         │ Relationship │         │  Resource   │
│─────────────│         │──────────────│         │─────────────│
│ id          │────────►│ userId       │◄────────│ id          │
│ name        │         │ relation     │         │ type        │
│ email       │         │ objectId     │         │ name        │
└─────────────┘         └──────────────┘         └─────────────┘
```

### Permission Check Algorithm

```
checkPermission(userId, resourceId, permission):
  1. Look up permission rule from schema
  2. If rule.relation == "doctor_of":
       SELECT 1 FROM Relationship
       WHERE userId = ? AND objectId = ? AND relation = "doctor_of"
  3. Return found/not-found
```

**Complexity:** O(1) — single indexed lookup.

### Technology Choices in V1

| Component | Choice | Rationale |
|---|---|---|
| Database | PostgreSQL | ACID transactions, foreign keys |
| ORM | Prisma | Type-safe queries, migrations |
| Runtime | Node.js + TypeScript | Developer velocity |
| Authorization layer | Custom graph engine | Learning & full control |

---

## Critical Review

### ✅ What V1 Gets Right

1. **Graph model is the correct primitive.** Google Zanzibar, SpiceDB, and OpenFGA all model authorization as directed graphs of tuples `(subject, relation, object)`.
2. **No role-table — correct.** Direct relationship encoding means per-resource, per-user specificity.
3. **Separation of data and policy** — relationships stored in DB, rules defined separately.

### ⚠️ What V1 Is Missing

<div class="callout callout-warn">

**Missing: Wildcard / public access**
`(*) ——[viewer]——> document` — no way to express "anyone can view".

**Missing: Subject set (group membership)**
Only individual users can hold relationships. Groups, teams, departments are not modeled.

**Missing: Hierarchical permissions**
A nurse assigned to a ward cannot automatically access patients *inside* that ward.

**Missing: Negative permissions / DENY rules**
No way to explicitly block a relationship.

</div>

### ❌ Incorrect Assumptions in V1

1. **Flat schema** — all relationships are stored in one table with a `relation` string. This is correct for Zanzibar but V1 lacks any type system — `doctor_of` on a `Department` resource is accepted silently.
2. **Permission = relation name** — V1 conflates relations and permissions. In Zanzibar, these are **distinct**: a *relation* is a direct edge; a *permission* is a computed set derived from relations.
3. **No zookie / consistency token** — Zanzibar uses *zookies* (consistency tokens) to guarantee freshness guarantees. V1 will read stale data under concurrent writes.

### Comparison with Industry Standards

| Concept | V1 | Google Zanzibar | SpiceDB | OpenFGA |
|---|---|---|---|---|
| Tuple model | ✅ `(user, relation, resource)` | ✅ `(user#rel, relation, object#rel)` | ✅ full | ✅ full |
| Subject sets | ❌ | ✅ | ✅ | ✅ |
| Typed relations | ❌ | ✅ | ✅ | ✅ |
| Consistency tokens | ❌ | ✅ zookies | ✅ ZedTokens | ✅ |
| Recursive permissions | ❌ | ✅ | ✅ | ✅ |

---

## What The Next Version Must Fix

1. **Recursive permission evaluation** — `ward.contains → patient.view` chain
2. **Subject abstraction** — groups, teams, departments
3. **Typed relations** — `relation doctor_of : user`

---

## Summary

V1 correctly establishes the **tuple-based directed graph** as the fundamental authorization primitive, mirroring the design of Google Zanzibar. It is a correct minimal starting point but lacks recursive evaluation, typed relations, and group membership — all of which are required for any real-world deployment.
