# Swarm PR: how the graph works

This folder holds the prompt, the work graph, and the runnable orchestration
script for building GoodSport v2 as **one large PR** with **one builder at a
time** and **many read-only reviewers in parallel**.

## Why a graph

The work is a directed acyclic graph (DAG). Each **node** is a work package
(WP) with a goal, the files it owns, the contracts it exports, and acceptance
tests. Each **edge** is a hard dependency: the downstream WP consumes a
contract the upstream WP produces (a type, a table, a route, a component).

Properties we use:

| Graph concept | What it means here |
|---|---|
| Topological order | The only legal build sequence. The conductor walks it; no WP starts until every predecessor is `done`. |
| Single-writer mutex | Exactly one **builder** agent holds the working tree at a time. This removes merge conflicts inside the PR entirely. |
| Read-only fan-out | **Verifier** agents (tests, security, UX, contract-check) run in parallel after each build because they never write. |
| Node state | `pending → building → verifying → done` or `blocked`. Stored in `docs/swarm/state.json` and committed with each node, so a killed run resumes from the last committed node. |
| Contract edges | Edges are labeled with the concrete export that crosses them (e.g. `Repository.saveEvent`). A verifier fails the node if the export is missing or its signature changed. |
| Critical path | The longest chain of nodes. It is the wall-clock floor; put the riskiest nodes early on it so failures surface first. |
| Cut set | The smallest set of nodes whose removal disconnects the graph. Those are the "must ship" core; everything downstream of them is where scope gets trimmed if time runs out. |

## Roles

- **Conductor** (the orchestrator, one process): loads `graph.json`, computes the topological order, checks `state.json`, and for each node runs *builder → verifiers → (fix loop ≤2) → commit*. Never edits code itself.
- **Builder** (one at a time): implements one node exactly as specified, runs the repo checks, commits with the node id in the subject, updates `state.json`.
- **Verifiers** (parallel, read-only): each takes one lens and returns pass/fail with evidence. A single fail sends the node back to the builder with the evidence attached.
- **Integrator** (last node): writes the PR description from the graph and commit history, and runs the full check suite once more.

## Files

- `PROMPT.md`: the prompt you hand to the conductor. Contains the conductor, builder, and verifier prompt templates.
- `graph.json`: the nodes and edges. Edit this to reshape scope; the script reads it.
- `workflow.js`: the runnable orchestration script for the Workflow tool.
- `state.json`: created by the first run; node status.
