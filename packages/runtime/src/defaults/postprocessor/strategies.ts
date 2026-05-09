import type { RetrievalCandidate } from "../../spec/retrieval-candidate.js"
import type { SelectionTraceItem } from "../../spec/selection-trace.js"
import type { PreprocessedQuery } from "../../spec/preprocessed-query.js"

export interface StrategyResult {
  kept: RetrievalCandidate[]
  dropped: RetrievalCandidate[]
}

export type CandidatePredicate = (input: {
  candidate: RetrievalCandidate
  request: PreprocessedQuery
}) => boolean | Promise<boolean>

export function applyScoreThreshold(
  candidates: RetrievalCandidate[],
  threshold: number,
  trace: SelectionTraceItem[],
): StrategyResult {
  const kept: RetrievalCandidate[] = []
  const dropped: RetrievalCandidate[] = []

  for (const c of candidates) {
    const score = c.rerankingScore ?? c.relevanceScore
    if (score != null && score < threshold) {
      dropped.push(c)
      trace.push({
        stage: "score-threshold",
        action: "dropped",
        candidateId: c.id,
        reason: `score ${score} < threshold ${threshold}`,
        metadata: { score, threshold },
      })
    } else {
      kept.push(c)
      trace.push({
        stage: "score-threshold",
        action: "kept",
        candidateId: c.id,
        metadata: score != null ? { score, threshold } : { threshold },
      })
    }
  }

  return { kept, dropped }
}

export function applyBudgetTrim(
  candidates: RetrievalCandidate[],
  budget: { maxCandidates?: number; maxPromptChars?: number },
  trace: SelectionTraceItem[],
): StrategyResult {
  let working = [...candidates]
  const dropped: RetrievalCandidate[] = []

  if (budget.maxCandidates != null && working.length > budget.maxCandidates) {
    const excess = working.slice(budget.maxCandidates)
    working = working.slice(0, budget.maxCandidates)
    for (const c of excess) {
      dropped.push(c)
      trace.push({
        stage: "budget-trim",
        action: "trimmed",
        candidateId: c.id,
        reason: `exceeded maxCandidates=${budget.maxCandidates}`,
        metadata: { budget },
      })
    }
  }

  if (budget.maxPromptChars != null) {
    let charCount = 0
    const newKept: RetrievalCandidate[] = []
    for (const c of working) {
      if (charCount + c.content.length > budget.maxPromptChars) {
        dropped.push(c)
        trace.push({
          stage: "budget-trim",
          action: "trimmed",
          candidateId: c.id,
          reason: `would exceed maxPromptChars=${budget.maxPromptChars}`,
          metadata: { budget, charCount },
        })
      } else {
        charCount += c.content.length
        newKept.push(c)
      }
    }
    working = newKept
  }

  return { kept: working, dropped }
}

export async function applyPredicateFilter(
  candidates: RetrievalCandidate[],
  predicate: CandidatePredicate,
  query: PreprocessedQuery,
  trace: SelectionTraceItem[],
): Promise<StrategyResult> {
  const kept: RetrievalCandidate[] = []
  const dropped: RetrievalCandidate[] = []

  for (const c of candidates) {
    const result = await predicate({ candidate: c, request: query })
    if (result) {
      kept.push(c)
      trace.push({ stage: "predicate", action: "kept", candidateId: c.id })
    } else {
      dropped.push(c)
      trace.push({ stage: "predicate", action: "dropped", candidateId: c.id, reason: "rejected by custom predicate" })
    }
  }

  return { kept, dropped }
}

export function applyNearDuplicateRemoval(
  candidates: RetrievalCandidate[],
  trace: SelectionTraceItem[],
): StrategyResult {
  const seen = new Set<string>()
  const kept: RetrievalCandidate[] = []
  const dropped: RetrievalCandidate[] = []

  for (const c of candidates) {
    if (seen.has(c.content)) {
      dropped.push(c)
      trace.push({
        stage: "near-duplicate",
        action: "dropped",
        candidateId: c.id,
        reason: "duplicate content",
      })
    } else {
      seen.add(c.content)
      kept.push(c)
      trace.push({ stage: "near-duplicate", action: "kept", candidateId: c.id })
    }
  }

  return { kept, dropped }
}

export function applySourceCoverage(
  candidates: RetrievalCandidate[],
  maxPerSource: number,
  trace: SelectionTraceItem[],
): StrategyResult {
  const sourceCounts = new Map<string, number>()
  const kept: RetrievalCandidate[] = []
  const dropped: RetrievalCandidate[] = []

  for (const c of candidates) {
    const source = c.source ?? "__unknown__"
    const count = sourceCounts.get(source) ?? 0

    if (count >= maxPerSource) {
      dropped.push(c)
      trace.push({
        stage: "source-coverage",
        action: "dropped",
        candidateId: c.id,
        reason: `source "${source}" exceeded limit`,
        metadata: { source, maxPerSource, currentCount: count },
      })
    } else {
      sourceCounts.set(source, count + 1)
      kept.push(c)
      trace.push({ stage: "source-coverage", action: "kept", candidateId: c.id, metadata: { source } })
    }
  }

  return { kept, dropped }
}
