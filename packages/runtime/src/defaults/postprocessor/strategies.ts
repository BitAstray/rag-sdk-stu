import type { RetrievalCandidate } from "../../spec/retrieval-candidate.js"
import type { PreprocessedQuery } from "../../spec/preprocessed-query.js"
import type { PostprocessorStep } from "./pipeline.js"

export type CandidatePredicate = (input: {
  candidate: RetrievalCandidate
  request: PreprocessedQuery
}) => boolean | Promise<boolean>

export function scoreThreshold(threshold: number): PostprocessorStep {
  return (context) => {
    const kept: RetrievalCandidate[] = []
    const dropped: RetrievalCandidate[] = []
    const trace = [...context.trace]

    for (const c of context.candidates) {
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

    return {
      ...context,
      candidates: kept,
      dropped: [...context.dropped, ...dropped],
      trace,
      appliedScoreThreshold: threshold,
    }
  }
}

export function budgetTrim(budget: { maxCandidates?: number; maxPromptChars?: number }): PostprocessorStep {
  return (context) => {
    let working = [...context.candidates]
    const dropped: RetrievalCandidate[] = []
    const trace = [...context.trace]

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

    return {
      ...context,
      candidates: working,
      dropped: [...context.dropped, ...dropped],
      trace,
      appliedBudget: budget,
    }
  }
}

export function predicateFilter(predicate: CandidatePredicate): PostprocessorStep {
  return async (context) => {
    const kept: RetrievalCandidate[] = []
    const dropped: RetrievalCandidate[] = []
    const trace = [...context.trace]

    for (const c of context.candidates) {
      const result = await predicate({ candidate: c, request: context.query })
      if (result) {
        kept.push(c)
        trace.push({ stage: "predicate", action: "kept", candidateId: c.id })
      } else {
        dropped.push(c)
        trace.push({ stage: "predicate", action: "dropped", candidateId: c.id, reason: "rejected by custom predicate" })
      }
    }

    return {
      ...context,
      candidates: kept,
      dropped: [...context.dropped, ...dropped],
      trace,
    }
  }
}

export function nearDuplicateRemoval(): PostprocessorStep {
  return (context) => {
    const seen = new Set<string>()
    const kept: RetrievalCandidate[] = []
    const dropped: RetrievalCandidate[] = []
    const trace = [...context.trace]

    for (const c of context.candidates) {
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

    return {
      ...context,
      candidates: kept,
      dropped: [...context.dropped, ...dropped],
      trace,
    }
  }
}

export function sourceCoverage(maxPerSource: number): PostprocessorStep {
  return (context) => {
    const sourceCounts = new Map<string, number>()
    const kept: RetrievalCandidate[] = []
    const dropped: RetrievalCandidate[] = []
    const trace = [...context.trace]

    for (const c of context.candidates) {
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

    return {
      ...context,
      candidates: kept,
      dropped: [...context.dropped, ...dropped],
      trace,
    }
  }
}
