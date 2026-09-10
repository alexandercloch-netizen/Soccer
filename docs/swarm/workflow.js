// Runnable orchestration for the Workflow tool. Plain JavaScript (no TS).
// Invoke with: Workflow({ scriptPath: "docs/swarm/workflow.js", args: { graph: <contents of graph.json>, branch: "<pr-branch>", startAt?: "<node id>" } })
//
// Walks the work graph in topological order. ONE builder at a time (single-writer
// mutex on the working tree). After each build, read-only verifiers run in
// parallel; any failure sends the node back to the builder with evidence, up to
// two fix rounds. Node state is committed to docs/swarm/state.json by the builder
// so a killed run resumes from the last completed node.

export const meta = {
  name: 'goodsport-swarm-pr',
  description: 'Build GoodSport v2 as one PR: sequential builders over a work DAG, parallel read-only verifiers',
  phases: [
    { title: 'Plan', detail: 'topological order + critical path' },
    { title: 'Build', detail: 'one builder at a time, per node' },
    { title: 'Verify', detail: 'parallel read-only lenses per node' },
    { title: 'Integrate', detail: 'PR description + final checks' },
  ],
}

const graph = args && args.graph
if (!graph || !Array.isArray(graph.nodes)) throw new Error('args.graph must be the parsed contents of docs/swarm/graph.json')
const branch = (args && args.branch) || 'claude/soccer-team-management-site-8kh6n9'

// ---------- Graph utilities (pure code, no agents) ----------
function topoOrder(nodes) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const indeg = Object.fromEntries(nodes.map(n => [n.id, 0]))
  for (const n of nodes) for (const d of n.dependsOn || []) { if (!byId[d]) throw new Error(`${n.id} depends on unknown ${d}`); indeg[n.id]++ }
  const ready = nodes.filter(n => indeg[n.id] === 0).map(n => n.id).sort()
  const order = []
  while (ready.length) {
    const id = ready.shift(); order.push(id)
    for (const n of nodes) if ((n.dependsOn || []).includes(id) && --indeg[n.id] === 0) { ready.push(n.id); ready.sort() }
  }
  if (order.length !== nodes.length) throw new Error('Cycle detected in graph')
  return order.map(id => byId[id])
}
function criticalPath(nodes) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const memo = {}
  const longest = id => memo[id] ?? (memo[id] = (byId[id].estimate || 1) + Math.max(0, ...(byId[id].dependsOn || []).map(longest)))
  const end = nodes.map(n => n.id).sort((a, b) => longest(b) - longest(a))[0]
  const path = []
  let cur = end
  while (cur) { path.unshift(cur); const deps = byId[cur].dependsOn || []; cur = deps.sort((a, b) => longest(b) - longest(a))[0] }
  return path
}

// ---------- Plan ----------
phase('Plan')
const order = topoOrder(graph.nodes)
const cp = criticalPath(graph.nodes)
log(`Build order: ${order.map(n => n.id).join(' → ')}`)
log(`Critical path: ${cp.join(' → ')}`)
const startIdx = args.startAt ? order.findIndex(n => n.id === args.startAt) : 0
if (startIdx < 0) throw new Error(`startAt ${args.startAt} not in graph`)

const contractsOf = n => (n.exports || []).map(e => `- ${e}`).join('\n') || '- (none)'
const consumesOf = n => (n.dependsOn || []).flatMap(d => (graph.nodes.find(x => x.id === d).exports || [])).map(e => `- ${e}`).join('\n') || '- (none)'

const builderPrompt = (n, evidence) => `You are the BUILDER for work package ${n.id}: ${n.title}.
Branch: ${branch}. You are the ONLY agent allowed to edit files right now. Read docs/swarm/PROMPT.md (Builder rules) and docs/swarm/graph.json first.

GOAL
${n.goal}

YOU OWN THESE PATHS (create/edit only here unless a contract below forces a touch elsewhere; if so, keep it minimal and say why in the commit body)
${(n.owns || []).map(p => `- ${p}`).join('\n')}

CONTRACTS YOU MUST EXPORT (verifiers will check these exist and are used)
${contractsOf(n)}

CONTRACTS YOU MAY CONSUME (from finished predecessors; do not redefine them)
${consumesOf(n)}

ACCEPTANCE TESTS (all must pass; add automated tests where the item says so)
${(n.acceptance || []).map(a => `- ${a}`).join('\n')}

${evidence ? `PREVIOUS VERIFY ROUND FAILED. Fix exactly these, nothing else:\n${evidence}\n` : ''}
WHEN DONE
1. Run: npm run typecheck && npm run lint && npm test && npm run build. All must pass.
2. Update docs/swarm/state.json: set "${n.id}" to {"status":"verifying","commit":"<sha>"}.
3. Commit everything with subject "${n.id}: ${n.title}" and push to ${branch}.
4. Return a short report: files changed, contracts exported, how each acceptance item was met, anything you could not do and why.`

const verifierPrompt = (n, lens, report) => `You are a READ-ONLY VERIFIER (${lens.id}: ${lens.title}) for work package ${n.id}: ${n.title} on branch ${branch}.
Do NOT edit any file. Read docs/swarm/PROMPT.md (Verifier rules), docs/swarm/graph.json, the builder's report below, and the diff of the latest commit(s) whose subject starts with "${n.id}:".

LENS INSTRUCTIONS
${lens.instructions}

CONTRACTS THAT MUST EXIST
${contractsOf(n)}

ACCEPTANCE ITEMS
${(n.acceptance || []).map(a => `- ${a}`).join('\n')}

BUILDER REPORT
${report}

Run whatever read-only commands you need (tests, grep, build). Return pass=false only for concrete, reproducible problems with file:line evidence. Nits go in "notes", not "failures".`

const VERDICT = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    failures: { type: 'array', items: { type: 'string' } },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'failures'],
}

// ---------- Build → Verify, strictly sequential per node ----------
const results = []
for (const n of order.slice(startIdx)) {
  let evidence = null
  let done = false
  for (let round = 0; round < 3 && !done; round++) {
    const report = await agent(builderPrompt(n, evidence), { label: `build:${n.id}${round ? `#${round + 1}` : ''}`, phase: 'Build' })
    if (report == null) throw new Error(`Builder for ${n.id} died`)
    const lenses = (graph.verifiers || []).filter(v => !v.only || v.only.includes(n.id))
    const verdicts = (await parallel(lenses.map(l => () => agent(verifierPrompt(n, l, report), { label: `verify:${n.id}:${l.id}`, phase: 'Verify', schema: VERDICT })))).filter(Boolean)
    const failures = verdicts.flatMap((v, i) => v.pass ? [] : v.failures.map(f => `[${lenses[i].id}] ${f}`))
    if (failures.length === 0) { done = true; results.push({ id: n.id, rounds: round + 1, notes: verdicts.flatMap(v => v.notes || []) }); log(`${n.id} done after ${round + 1} round(s)`) }
    else { evidence = failures.join('\n'); log(`${n.id}: ${failures.length} failure(s), sending back to builder`) }
  }
  if (!done) { log(`${n.id} BLOCKED after 3 rounds; stopping so a human can look. Resume with args.startAt="${n.id}".`); return { blocked: n.id, evidence, results } }
}

// ---------- Integrate ----------
phase('Integrate')
const pr = await agent(`You are the INTEGRATOR. On branch ${branch}, read docs/swarm/graph.json, docs/swarm/state.json, and git log for commits whose subjects start with a node id. Run the full check suite once more (npm run typecheck && npm run lint && npm test && npm run build). Then write the pull request description to docs/swarm/PR-DESCRIPTION.md: summary, the work graph as a Mermaid diagram, per-node changes with commit SHAs, environment variables and migration steps for Netlify, how to test as admin/coach/parent, and known gaps. Commit and push it. Do NOT open the PR; return the description text.`, { label: 'integrate', phase: 'Integrate' })
return { results, prDescription: pr }
