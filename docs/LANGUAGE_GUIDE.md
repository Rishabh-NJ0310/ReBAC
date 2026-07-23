# Authorization DSL (ADSL) Language Guide & Specification v1.0

The **Authorization DSL (ADSL)** is a declarative, human-readable domain-specific language designed for defining Relationship-Based Access Control (ReBAC) permission models in microservices and healthcare systems.

---

## Table of Contents
1. [Design Philosophy](#1-design-philosophy)
2. [File Extension & Structure](#2-file-extension--structure)
3. [Language Syntax](#3-language-syntax)
   - [Resource Definition](#resource-definition)
   - [Relation Declaration](#relation-declaration)
   - [Permission Definition](#permission-definition)
4. [Logical Operators & Precedence](#4-logical-operators--precedence)
5. [Recursive Relationship Traversal](#5-recursive-relationship-traversal)
6. [Comments & Whitespace](#6-comments--whitespace)
7. [Semantic Validation & Errors](#7-semantic-validation--errors)
8. [Complete Example](#8-complete-example)

---

## 1. Design Philosophy

- **Human Readable**: Non-technical domain administrators (e.g. hospital compliance managers) can audit permissions.
- **Declarative**: Expresses *what* permissions mean, never *how* to compute them.
- **Stateless & Deterministic**: Relationship tuples remain in database tables; ADSL defines evaluation paths.
- **Compile-time Safety**: Catches missing relations and typos prior to runtime execution.

---

## 2. File Extension & Structure

ADSL schemas are saved with the `.auth` file extension (e.g., `hospital.auth`).

A `.auth` file consists of zero or more **Resource Blocks**:

```auth
# Example Schema Structure
resource <ResourceName> {
    relation <RelationName>

    permission <PermissionName> = <Expression>
}
```

---

## 3. Language Syntax

### Resource Definition
Defines the authorization scope for a specific target entity (e.g., `patient`, `ward`, `department`, `bill`).

```auth
resource patient {
    ...
}
```

### Relation Declaration
Explicitly declares graph edge types supported by this resource. Every relation used in a permission must be declared with `relation`.

```auth
relation doctor_of
relation contains
relation admin
```

### Permission Definition
Computes a Boolean evaluation verdict (`ALLOWED` / `DENIED`) by combining declared relations with logical operators and recursive checks.

```auth
permission view = doctor_of OR contains -> view
permission edit = doctor_of
permission delete = admin
```

---

## 4. Logical Operators & Precedence

ADSL supports three logical operators:

| Operator | Type | Description |
| :--- | :--- | :--- |
| `OR` | Binary | Evaluates to `true` if at least one rule evaluates to `true`. |
| `AND` | Binary | Evaluates to `true` only if both rules evaluate to `true`. |
| `NOT` | Unary | Inverts the evaluation result of the rule. |

### Precedence Hierarchy (Highest to Lowest)
1. **Parentheses**: `( ... )`
2. **Unary NOT**: `NOT`
3. **Binary AND**: `AND`
4. **Binary OR**: `OR`

#### Example Precedence Resolution
```auth
permission edit = doctor_of AND same_department OR admin
```
Evaluates as: `(doctor_of AND same_department) OR admin`

---

## 5. Recursive Relationship Traversal

To support hierarchical permissions (e.g. ward containing patients, department containing wards), use the arrow operator `->`:

```auth
relation contains

permission view = contains -> view
```

**Meaning**: If a user does not have a direct relation to the patient, traverse up parent resources connected by `contains` and evaluate `view` on those parents recursively.

---

## 6. Comments & Whitespace

- **Single-Line Comments**: Start with `#` or `//`. They are stripped during tokenization.
- **Whitespace**: Spaces, tabs, and newlines are ignored.

```auth
# Single line comment using hash
// Single line comment using double slash

permission view =
    doctor_of # inline comment
    OR contains -> view
```

---

## 7. Semantic Validation & Errors

The ADSL compiler enforces strict compile-time validation:
1. **Duplicate Resource**: A resource type cannot be declared twice.
2. **Duplicate Relation / Permission**: Names must be unique within a resource block.
3. **Undeclared Relation**: If a permission references a relation (e.g. `admin`), it **must** be declared using `relation admin`.

---

## 8. Complete Example

```auth
# Hospital Authorization Schema v1.0

resource patient {
    relation doctor_of
    relation contains
    relation admin

    permission view =
        doctor_of
        OR contains -> view

    permission edit =
        doctor_of

    permission delete =
        admin
}

resource ward {
    relation assigned_nurse
    relation contains

    permission view =
        assigned_nurse
        OR contains -> view
}

resource department {
    relation head_of

    permission view =
        head_of
}

resource bill {
    relation has_bill
    relation pharmacist_of
    relation contains

    permission view = 
        has_bill
        OR pharmacist_of -> has_bill
        OR contains -> view
}

resource pharmacy {
    relation pharmacist_of
    relation contains

    permission view = 
        contains -> view
}
```
