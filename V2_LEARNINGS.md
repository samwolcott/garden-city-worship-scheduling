# V2 Learnings from V1

This is a lightweight record of observations made while using V1. Entries are
evidence for V2 product and scoring decisions; they are not automatically
approved requirements or implementation tasks.

When asked to “add this to our V2 learnings,” append an entry using this format:

## YYYY-MM-DD — Short title

**V1 result:**

What V1 generated or what workflow occurred.

**Observation:**

What felt incorrect, surprising, inefficient, or particularly successful.

**V2 implication:**

The rule, model, test scenario, or workflow hypothesis this suggests.

**Status:** UNREVIEWED

Statuses: `UNREVIEWED`, `ACCEPTED FOR ROADMAP`, `REJECTED`, or `VALIDATED`.

---

## 2026-10-18 — Complete-band balance matters more than isolated tier variety

**V1 result:**

V1 could produce individually eligible musicians while evaluating tiers during
incremental assignment rather than evaluating the completed band's relationships.

**Observation:**

A lineup can appear balanced by A/B/C counts but still feel weak when developing
musicians occupy mutually dependent roles, especially in the rhythm section.

**V2 implication:**

Add a scenario test for rhythm-section support and evaluate complete candidate
bands using anchor and complementary-role rules.

**Status:** ACCEPTED FOR ROADMAP

## 2026-10-18 — Talent can vary by role

**V1 result:**

V1 assigns one A/B/C tier to a musician across all Planning Center positions.

**Observation:**

A musician may be an A on bass and a B on another instrument.

**V2 implication:**

Use private role-specific A/B/C ratings, with the V1 global tier available only
as a visible seed or fallback during migration.

**Status:** ACCEPTED FOR ROADMAP
