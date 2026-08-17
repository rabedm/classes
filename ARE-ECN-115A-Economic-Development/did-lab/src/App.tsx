"use client";

import { useEffect, useMemo, useState } from "react";

type Example = {
  id: string;
  tabLabel: string;
  title: string;
  policy: string;
  treated: string;
  comparison: string;
  before: string;
  after: string;
  outcome: string;
  unit: string;
  values: [number, number, number, number];
  range: [number, number];
  deviationRange: [number, number];
  source: string;
  sourceLabel: string;
  note: string;
};

const CARD: Example = {
  id: "card-krueger",
  tabLabel: "Minimum wage",
  title: "Did raising New Jersey’s minimum wage reduce fast-food employment?",
  policy: "New Jersey raised its minimum wage from $4.25 to $5.05 on April 1, 1992.",
  treated: "New Jersey",
  comparison: "Pennsylvania",
  before: "Feb–Mar 1992 (Pre)",
  after: "Nov–Dec 1992 (Post)",
  outcome: "FTE employees per restaurant",
  unit: "FTE",
  values: [20.4, 21.0, 23.3, 21.2],
  range: [18, 23.6],
  deviationRange: [-4, 4],
  source: "https://www.jstor.org/stable/2118030",
  sourceLabel: "Read the published article",
  note: "The graph uses the paper’s rounded state means. The paper reports a simple DiD of 2.76 FTE employees.",
};

const CREDIT: Example = {
  id: "breza-kinnan",
  tabLabel: "Credit markets",
  title: "How did the loss of microfinance credit affect non-agricultural rural wages?",
  policy: "After Andhra Pradesh halted microfinance activity in October 2010, exposed lenders sharply reduced credit in other districts where they operated.",
  treated: "Districts served by affected lenders",
  comparison: "Districts served by unaffected lenders",
  before: "Before Oct. 2010 (Pre)",
  after: "After Oct. 2010 (Post)",
  outcome: "Non-agricultural casual daily wage (INR)",
  unit: "INR",
  values: [180, 165.6, 195, 190],
  range: [150, 205],
  deviationRange: [-20, 20],
  source: "https://doi.org/10.1093/qje/qjab016",
  sourceLabel: "Read the published article",
  note: "Breza and Kinnan (2021), Table 5, estimate that exposure to the credit contraction reduced non-agricultural casual daily wages by 9.4 INR (about 5.1% of the comparison mean). The four values shown here are simplified examples chosen to reproduce the paper’s reported −9.4 INR estimate and match the course diagram. The paper does not report these four group averages.",
};

const ROADS: Example = {
  id: "shamdasani",
  tabLabel: "Rural roads",
  title: "How did all-weather rural roads change crop choice?",
  policy: "India’s rural-road program began in 2000. The study compares households in villages that received an all-weather road by 2006 with eligible villages where roads had not yet been built.",
  treated: "Villages receiving roads by 2006",
  comparison: "Eligible villages without roads by 2006",
  before: "1999 (Pre)",
  after: "2006 (Post)",
  outcome: "Households growing non-cereal crops",
  unit: "%",
  values: [34, 64, 25, 29],
  range: [15, 75],
  deviationRange: [-20, 20],
  source: "https://doi.org/10.1016/j.jdeveco.2021.102686",
  sourceLabel: "Read the published article",
  note: "Shamdasani (2021), Table 4, column 1, estimates that the share of remote households cultivating non-cereal crops increased by 26 percentage points. The four values shown here are simplified examples chosen to reproduce the paper’s reported increase of 26 percentage points and match the course diagram. The paper does not report these four group averages.",
};

const EXPLORE_EXAMPLES = [CARD, CREDIT, ROADS];

const DIAGNOSTIC_QUESTIONS: Record<string, Array<{ statement: string; answer: boolean; why: string }>> = {
  [CARD.id]: [
    {
      statement: "New Jersey’s before-and-after employment change alone identifies the effect of the minimum-wage increase.",
      answer: false,
      why: "New Jersey employment could also have changed because of other factors occurring over time. DiD uses Pennsylvania’s change to account for those time-related changes.",
    },
    {
      statement: "Under parallel trends, Pennsylvania’s employment change can be applied to New Jersey’s pre-policy employment to estimate New Jersey’s counterfactual.",
      answer: true,
      why: "This estimates what New Jersey employment would have been after the policy if the minimum wage had not increased.",
    },
  ],
  [CREDIT.id]: [
    {
      statement: "The wage change in districts served by affected lenders alone identifies the effect of the credit contraction.",
      answer: false,
      why: "Wages in those districts could also have changed because of other factors occurring over time. DiD uses the wage change in districts served by unaffected lenders to account for those changes.",
    },
    {
      statement: "Under parallel trends, the wage change in districts served by unaffected lenders can be applied to the affected districts’ pre-policy wage to estimate their counterfactual.",
      answer: true,
      why: "This estimates what wages in the affected districts would have been after the credit contraction if their lenders had not been affected.",
    },
  ],
  [ROADS.id]: [
    {
      statement: "The change in non-cereal crop cultivation in villages receiving roads alone identifies the effect of the road program.",
      answer: false,
      why: "Crop choices in those villages could also have changed because of other factors occurring over time. DiD uses the change in eligible villages without roads to account for those changes.",
    },
    {
      statement: "Under parallel trends, the change in eligible villages without roads can be applied to the pre-policy outcome of villages receiving roads to estimate their counterfactual.",
      answer: true,
      why: "This estimates what non-cereal crop cultivation in the road villages would have been in the post period if they had not received roads.",
    },
  ],
};

const STEPS = [
  {
    kicker: "The policy problem",
    question: "What would employment in New Jersey restaurants have been without the wage increase?",
    explanation: "We observe employment in New Jersey restaurants before and after the wage increase. To measure the policy’s effect, we also need to know what their post-policy employment would have been if the wage had not increased. We cannot observe this no-policy outcome directly; it is the counterfactual.",
  },
  {
    kicker: "A tempting first answer",
    question: "Employment rose from 20.4 to 21.0. Is 0.6 the policy effect?",
    explanation: "Not necessarily. A before-and-after change may also reflect a recession, seasonal patterns, or anything else that changed over time.",
  },
  {
    kicker: "Introduce a comparison group",
    question: "Can Pennsylvania help us separate the policy effect from other changes over time?",
    explanation: "Pennsylvania did not raise its minimum wage and is geographically close to New Jersey. Its employment change can help us account for other factors affecting employment over the same period. For Pennsylvania to provide a valid comparison, we must assume that, without the policy, average employment in New Jersey would have changed by the same amount.",
  },
  {
    kicker: "Four observed means",
    question: "Does Pennsylvania’s higher starting level disqualify it as a comparison?",
    explanation: "No. DiD does not require equal starting levels. It requires that, without the policy, average employment would have changed by the same amount in both states.",
  },
  {
    kicker: "Two first differences",
    question: "How did employment change in each state?",
    explanation: "New Jersey employment changed by 0.6 FTE, while Pennsylvania employment changed by −2.1 FTE. At this point, these are simply two observed changes; we have not yet used Pennsylvania’s change to estimate New Jersey’s counterfactual.",
  },
  {
    kicker: "Estimate the counterfactual",
    question: "If untreated trends were parallel, where would New Jersey employment have ended?",
    explanation: "Under parallel trends, we assume that without the policy New Jersey would have experienced the same −2.1 FTE change as Pennsylvania. Applying that change to New Jersey’s 20.4 FTE baseline gives an estimated counterfactual of 18.3 FTE. This outcome is unobserved and cannot be verified directly because New Jersey was actually treated in the post period.",
  },
  {
    kicker: "Estimate the policy effect",
    question: "What is the estimated effect of New Jersey’s minimum-wage increase?",
    explanation: "Under the parallel-trends assumption, New Jersey’s estimated counterfactual employment is 18.3 FTE. Its observed post-policy employment is 21.0 FTE. The estimated policy effect is the difference between them: 21.0 − 18.3 = 2.7 FTE employees per restaurant.",
  },
  {
    kicker: "The DiD estimator",
    question: "How can we calculate the estimated effect from the four observed averages?",
    explanation: "First calculate the change in employment from pre to post for each state. Then subtract Pennsylvania’s change from New Jersey’s change. This produces the same 2.7 FTE estimated policy effect.",
  },
];

function fmt(value: number, unit: string) {
  const digits = Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(digits)}${unit === "%" ? "%" : ""}`;
}

function fmtDifference(value: number, unit: string) {
  const formatted = fmt(value, unit === "%" ? "" : unit);
  return unit === "%" ? `${formatted} pp` : `${formatted} ${unit}`;
}

function BetaHat() {
  return (
    <span className="beta-hat" role="img" aria-label="beta hat">
      <svg viewBox="0 0 24 28" aria-hidden="true">
        <path d="M5 7 L12 2 L19 7" />
        <text x="12" y="25" textAnchor="middle">β</text>
      </svg>
    </span>
  );
}

function OutcomeGraph({
  example,
  values,
  reveal = 8,
  untreatedChange,
}: {
  example: Example;
  values: [number, number, number, number];
  reveal?: number;
  untreatedChange?: number;
}) {
  const [t0, t1, c0, c1] = values;
  const x0 = 142;
  const x1 = 470;
  const comparisonChange = c1 - c0;
  const counterfactual = t0 + comparisonChange;
  const trueCounterfactual = t0 + (untreatedChange ?? comparisonChange);
  const [baseMin, baseMax] = example.range;
  const plottedValues = untreatedChange === undefined ? [...values, counterfactual] : [...values, counterfactual, trueCounterfactual];
  const min = Math.min(baseMin, Math.floor((Math.min(...plottedValues) - 0.2) * 10) / 10);
  const max = Math.max(baseMax, Math.ceil((Math.max(...plottedValues) + 0.2) * 10) / 10);
  const y = (v: number) => 286 - ((v - min) / (max - min)) * 226;
  const pathsMatch = untreatedChange !== undefined && Math.abs(untreatedChange - comparisonChange) < 0.051;
  const showT1Point = reveal >= 0;
  const showTreatedLine = reveal >= 1;
  const showC1 = reveal >= 2;
  const showC0 = reveal >= 2;
  const showCounterfactual = reveal >= 5;
  const showEffect = reveal >= 6;
  const effectMidY = (y(t1) + y(counterfactual)) / 2;
  const counterfactualLabelY = example.id === CARD.id
    ? y(counterfactual) - 30
    : y(counterfactual) > 90 ? y(counterfactual) - 14 : y(counterfactual) + 20;
  const trueCounterfactualLabelY = y(trueCounterfactual) > 258 ? y(trueCounterfactual) - 14 : y(trueCounterfactual) + 20;

  return (
    <figure className="chart-shell">
      <svg viewBox="0 0 620 350" role="img" aria-labelledby={`chart-${example.id}-title chart-${example.id}-desc`}>
        <title id={`chart-${example.id}-title`}>{example.title}</title>
        <desc id={`chart-${example.id}-desc`}>
          {example.treated} changes from {t0} to {t1}; {example.comparison} changes from {c0} to {c1}. The difference-in-differences estimate is {fmtDifference((t1 - t0) - (c1 - c0), example.unit)}.
        </desc>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const value = min + (max - min) * (1 - p);
          const yp = 60 + p * 226;
          return (
            <g key={p}>
              <line x1="76" x2="548" y1={yp} y2={yp} className="grid-line" />
              <text x="66" y={yp + 4} textAnchor="end" className="axis-label">{fmt(value, example.unit)}</text>
            </g>
          );
        })}
        <line x1="76" x2="548" y1="286" y2="286" className="axis-line" />
        <text x="19" y="173" textAnchor="middle" transform="rotate(-90 19 173)" className="y-axis-title">{example.outcome}</text>
        <text x="306" y="40" textAnchor="middle" className="policy-label">policy</text>
        <line x1="306" x2="306" y1="48" y2="282" className="policy-line" />
        <text x={x0} y="318" textAnchor="middle" className="axis-title">{example.before}</text>
        <text x={x1} y="318" textAnchor="middle" className="axis-title">{example.after}</text>

        {showTreatedLine && <line x1={x0} y1={y(t0)} x2={x1} y2={y(t1)} className="treated-line" />}
        {showC0 && showC1 && <line x1={x0} y1={y(c0)} x2={x1} y2={y(c1)} className="comparison-line" />}
        {showCounterfactual && <line x1={x0} y1={y(t0)} x2={x1} y2={y(counterfactual)} className="counterfactual-line" />}
        {untreatedChange !== undefined && !pathsMatch && <line x1={x0} y1={y(t0)} x2={x1} y2={y(trueCounterfactual)} className="true-counterfactual-line" />}

        <circle cx={x0} cy={y(t0)} r="4" className="treated-point" />
        <text x={x0 - 8} y={y(t0) + 4} textAnchor="end" className="value-label treated-text">{fmt(t0, example.unit)}</text>
        {showT1Point && <circle cx={x1} cy={y(t1)} r="4" className="treated-point" />}
        {showT1Point && <text x={x1 + 10} y={y(t1) + 16} className="value-label treated-text">{fmt(t1, example.unit)}</text>}

        {showC0 && <rect x={x0 - 4} y={y(c0) - 4} width="8" height="8" rx="1" className="comparison-point" />}
        {showC0 && <text x={x0 - 8} y={y(c0) + 4} textAnchor="end" className="value-label comparison-text">{fmt(c0, example.unit)}</text>}
        {showC1 && <rect x={x1 - 4} y={y(c1) - 4} width="8" height="8" rx="1" className="comparison-point" />}
        {showC1 && <text x={x1 + 10} y={y(c1) - 8} className="value-label comparison-text">{fmt(c1, example.unit)}</text>}

        {showCounterfactual && <circle cx={x1} cy={y(counterfactual)} r="8" className="counterfactual-point" />}
        {showCounterfactual && <text x={x1 - 12} y={counterfactualLabelY} textAnchor="end" className="value-label counterfactual-text">Counterfactual {fmt(counterfactual, example.unit)}</text>}

        {untreatedChange !== undefined && !pathsMatch && <circle cx={x1} cy={y(trueCounterfactual)} r="7" className="true-counterfactual-point" />}
        {untreatedChange !== undefined && !pathsMatch && <text x={x1 - 12} y={trueCounterfactualLabelY} textAnchor="end" className="value-label true-text">Counterfactual when parallel trends is violated {fmt(trueCounterfactual, example.unit)}</text>}

        {showEffect && (
          <g className="effect-bracket">
            <line x1="522" x2="522" y1={y(t1)} y2={y(counterfactual)} />
            <line x1="513" x2="531" y1={y(t1)} y2={y(t1)} />
            <line x1="513" x2="531" y1={y(counterfactual)} y2={y(counterfactual)} />
            <text x="536" y={effectMidY - 3}>β</text>
            <path d={`M536 ${effectMidY - 15} L540 ${effectMidY - 18} L544 ${effectMidY - 15}`} className="svg-beta-hat" />
            <text x="548" y={effectMidY - 3}>= {fmtDifference((t1 - t0) - comparisonChange, example.unit)}</text>
          </g>
        )}
      </svg>
      <figcaption className="legend" aria-label="Graph legend">
        <span><i className="legend-dot treated-dot" />{example.treated} (Treated)</span>
        <span><i className="legend-square comparison-square" />{example.comparison} ({example.id === CARD.id ? "Control group" : "Comparison"})</span>
        {(showCounterfactual || untreatedChange !== undefined) && <span><i className="legend-dash" />Counterfactual</span>}
        {untreatedChange !== undefined && !pathsMatch && <span><i className="legend-dash true-dash" />Counterfactual when the parallel trends assumption is violated</span>}
      </figcaption>
    </figure>
  );
}

function GuidedLesson() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const move = (next: number) => {
    setStep(next);
  };

  return (
    <section id="guided" className="lesson-section" aria-labelledby="guided-title">
      <div className="section-heading guided-heading">
        <div>
          <p className="eyebrow">01 · Guided case</p>
          <h2 id="guided-title">Build the DiD estimate step by step</h2>
        </div>
      </div>
      <div className="progress-row" aria-label={`Lesson step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((_, index) => (
          <button key={index} className={index === step ? "progress-step active" : index < step ? "progress-step done" : "progress-step"} onClick={() => move(index)} aria-label={`Go to step ${index + 1}`} aria-current={index === step ? "step" : undefined}>
            {index + 1}
          </button>
        ))}
      </div>

      <div className="lesson-grid">
        <div>
          <h3>{CARD.title}</h3>
          <p className="policy-copy">{CARD.policy}</p>
          <OutcomeGraph example={CARD} values={CARD.values} reveal={step} />
          <p className="source-note">{CARD.note}</p>
        </div>

        <aside className="teaching-panel" aria-live="polite">
          <span className="step-count">Step {step + 1} of {STEPS.length}</span>
          <p className="panel-kicker">{current.kicker}</p>
          <h3>{current.question}</h3>
          <p>{current.explanation}</p>

          {step === 5 && (
            <div className="formula-card worked-counterfactual">
              <p>Estimated counterfactual under parallel trends</p>
              <div className="counterfactual-formula">
                <span className="counterfactual-formula-left">Ê[Y<sub>i0</sub><sup>post</sup> | D<sub>i</sub> = 1]</span>
                <span>= E[Y<sub>i0</sub><sup>pre</sup> | D<sub>i</sub> = 1]</span>
                <span className="counterfactual-formula-indent">+ (E[Y<sub>i0</sub><sup>post</sup> | D<sub>i</sub> = 0] − E[Y<sub>i0</sub><sup>pre</sup> | D<sub>i</sub> = 0])</span>
              </div>
              <strong>20.4 + (21.2 − 23.3)</strong>
              <span>20.4 − 2.1 = 18.3 FTE</span>
            </div>
          )}

          {step === 7 && (
            <div className="formula-card expected-value-formula">
              <p>Difference in differences</p>
              <div className="math-line stacked-did-formula">
                <span className="did-formula-label"><BetaHat /><sub>DiD</sub> =</span>
                <span className="math-group">[E(Y<sub>i1</sub><sup>post</sup> | D<sub>i</sub> = 1) − E(Y<sub>i0</sub><sup>pre</sup> | D<sub>i</sub> = 1)]</span>
                <span className="did-formula-operator">−</span>
                <span className="math-group">[E(Y<sub>i0</sub><sup>post</sup> | D<sub>i</sub> = 0) − E(Y<sub>i0</sub><sup>pre</sup> | D<sub>i</sub> = 0)]</span>
              </div>
              <strong><BetaHat /><sub>DiD</sub> = (21 − 20.4) − (21.2 − 23.3)</strong>
              <span><BetaHat /><sub>DiD</sub> = 0.6 − (−2.1) = 2.7 FTE</span>
            </div>
          )}

          <div className="lesson-actions">
            <button className="button ghost" onClick={() => move(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
            <button className="button primary" onClick={() => move(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}>Continue</button>
          </div>
        </aside>
      </div>

      {step === 7 && (
        <div className="estimators" aria-label="Comparison of three estimators">
          <article>
            <span>Post-only</span>
            <strong>−0.2 FTE</strong>
            <p>Compares employment in New Jersey and Pennsylvania after the policy. Because the states began at different employment levels, the post-policy gap may reflect both their pre-existing difference and the policy’s effect.</p>
          </article>
          <article>
            <span>New Jersey before–after</span>
            <strong>0.6 FTE</strong>
            <p>Shows how employment changed in New Jersey, but the change may also reflect other factors that changed over time.</p>
          </article>
          <article className="selected-estimator">
            <span>Difference in differences</span>
            <strong>2.7 FTE</strong>
            <p>Uses both states and both periods to estimate the policy effect.</p>
          </article>
        </div>
      )}
    </section>
  );
}

function ExploreCases({ selectedId, onSelectedIdChange }: { selectedId: string; onSelectedIdChange: (id: string) => void }) {
  const selected = EXPLORE_EXAMPLES.find((example) => example.id === selectedId) ?? CARD;
  const [values, setValues] = useState<[number, number, number, number]>(CARD.values);
  const [trendDeviation, setTrendDeviation] = useState(0);

  useEffect(() => {
    setValues(selected.values);
    setTrendDeviation(0);
  }, [selected]);

  const reset = () => {
    setValues(selected.values);
    setTrendDeviation(0);
  };

  const selectExample = (example: Example) => {
    onSelectedIdChange(example.id);
  };

  const [t0, t1, c0, c1] = values;
  const comparisonChange = c1 - c0;
  const untreatedChange = comparisonChange + trendDeviation;
  const did = (t1 - t0) - (c1 - c0);
  const trueEffect = t1 - (t0 + untreatedChange);
  const bias = did - trueEffect;
  const update = (index: number, next: number) => {
    const copy = [...values] as [number, number, number, number];
    copy[index] = next;
    setValues(copy);
  };

  return (
    <section id="explore" className="lesson-section explore-section" aria-labelledby="explore-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 · Explore</p>
          <h2 id="explore-title">Explore three DiD examples</h2>
          <p className="section-intro">Experiment with the minimum-wage example or explore the credit-market and rural-road studies covered in class. Move each study’s four observed outcomes, then introduce a deviation from parallel trends to see how the counterfactual and the resulting estimate change.</p>
        </div>
      </div>

      <div className="case-picker" role="tablist" aria-label="Choose a difference-in-differences example">
        {EXPLORE_EXAMPLES.map((example, index) => (
          <button
            key={example.id}
            type="button"
            role="tab"
            aria-selected={selected.id === example.id}
            aria-controls="explore-case"
            className={selected.id === example.id ? "case-choice selected" : "case-choice"}
            onClick={() => selectExample(example)}
          >
            <span>Example {index + 1}</span>
            <strong>{example.tabLabel}</strong>
          </button>
        ))}
      </div>

      <div id="explore-case" className="explore-grid" role="tabpanel">
        <div>
          <h3>{selected.title}</h3>
          <p className="policy-copy">{selected.policy}</p>
          <p className="policy-copy">The orange and green paths show observed outcomes. The <strong>(unobserved) gold line</strong> shows the counterfactual under parallel trends: the treated group’s baseline plus the comparison group’s change. Move the red “Deviation from parallel trends” slider to examine what happens when the parallel trends assumption is violated.</p>
          <OutcomeGraph example={selected} values={values} untreatedChange={untreatedChange} />
          <p className="source-note">{selected.note}{selected.id !== CARD.id && <> <a href={selected.source} target="_blank" rel="noreferrer">{selected.sourceLabel}</a>.</>}</p>
        </div>

        <aside className="controls-panel">
          <div className="live-results" aria-live="polite">
            <div><span>DiD estimate</span><strong>{fmtDifference(did, selected.unit)}</strong></div>
            <div><span>Effect implied by selected counterfactual</span><strong>{fmtDifference(trueEffect, selected.unit)}</strong></div>
            <div><span>Bias</span><strong>{fmtDifference(bias, selected.unit)}</strong></div>
          </div>

          <p className="control-heading">Move the four observed outcomes</p>
          {[
            { label: `${selected.treated} · ${selected.before}`, period: "Pre", treatment: 1, potentialOutcome: 0 },
            { label: `${selected.treated} · ${selected.after}`, period: "Post", treatment: 1, potentialOutcome: 1 },
            { label: `${selected.comparison} · ${selected.before}`, period: "Pre", treatment: 0, potentialOutcome: 0 },
            { label: `${selected.comparison} · ${selected.after}`, period: "Post", treatment: 0, potentialOutcome: 0 },
          ].map(({ label, period, treatment, potentialOutcome }, index) => (
            <label className="range-control" key={label}>
              <span className="control-label"><span>{label}<em>E[Y<sub>i{potentialOutcome}</sub><sup>{period}</sup> | D<sub>i</sub> = {treatment}]</em></span><b>{fmt(values[index], selected.unit)}</b></span>
              <input type="range" min={selected.range[0]} max={selected.range[1]} step={selected.unit === "%" ? 1 : 0.1} value={values[index]} onChange={(event) => update(index, Number(event.target.value))} />
            </label>
          ))}

          <label className="range-control assumption-control">
            <span>Deviation from parallel trends</span>
            <input type="range" min={selected.deviationRange[0]} max={selected.deviationRange[1]} step={selected.unit === "%" ? 1 : 0.1} value={trendDeviation} onChange={(event) => setTrendDeviation(Number(event.target.value))} />
          </label>
          <div className={Math.abs(trendDeviation) < 0.051 ? "trend-status parallel" : "trend-status biased"}>
            {Math.abs(trendDeviation) < 0.051 ? "The parallel trends assumption holds: the two counterfactuals coincide, so the DiD estimate equals the selected policy effect." : "The parallel trends assumption is violated. The red and gold counterfactuals no longer coincide, so the DiD estimate is biased."}
          </div>
          <p className="control-help">The gold line is the counterfactual under parallel trends. At zero deviation, the red line coincides with it. Changing any observed outcome moves both lines together; moving the deviation slider separates them.</p>
          <button className="button secondary full" onClick={reset}>Reset this example</button>
        </aside>
      </div>
    </section>
  );
}

function QuickDiagnostic({ selectedId, onSelectedIdChange }: { selectedId: string; onSelectedIdChange: (id: string) => void }) {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const selected = EXPLORE_EXAMPLES.find((example) => example.id === selectedId) ?? CARD;
  const questions = useMemo(() => [
    { statement: "Treated and comparison groups must begin at the same outcome level.", answer: false, why: "The groups may begin at different average outcome levels because DiD compares their changes over time, not their levels." },
    ...(DIAGNOSTIC_QUESTIONS[selected.id] ?? DIAGNOSTIC_QUESTIONS[CARD.id]),
  ], [selected.id]);

  return (
    <section id="quick-check" className="lesson-section concepts-section" aria-labelledby="quick-check-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 · Quick diagnostic</p>
          <h2 id="quick-check-title">Check your DiD intuition</h2>
        </div>
      </div>

      <div className="diagnostic-picker" aria-label="Choose the example for the diagnostic questions">
        <span>Questions based on:</span>
        <div role="group" aria-label="Diagnostic example">
          {EXPLORE_EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              className={selected.id === example.id ? "diagnostic-choice selected" : "diagnostic-choice"}
              aria-pressed={selected.id === example.id}
              onClick={() => onSelectedIdChange(example.id)}
            >
              {example.tabLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-block">
        <div><h3>Would you make these claims?</h3></div>
        <div className="quiz-list">
          {questions.map((item, index) => (
            <div className="quiz-item" key={item.statement}>
              <p>{item.statement}</p>
              <div className="quiz-actions">
                <button className={answers[index] === true ? "choice chosen" : "choice"} onClick={() => setAnswers({ ...answers, [index]: true })}>True</button>
                <button className={answers[index] === false ? "choice chosen" : "choice"} onClick={() => setAnswers({ ...answers, [index]: false })}>False</button>
              </div>
              {answers[index] !== undefined && answers[index] !== null && (
                <p className={answers[index] === item.answer ? "quiz-feedback correct" : "quiz-feedback"}>{answers[index] === item.answer ? "Correct. " : "Not quite. "}{item.why}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [selectedExampleId, setSelectedExampleId] = useState(CARD.id);

  return (
    <main data-version="18">
      <header className="site-header">
        <div className="brand-group"><a className="brand" href="#top" aria-label="DiD Lab home"><span className="brand-mark">ΔΔ</span><span className="brand-title">DiD Lab</span></a><span className="course-code">for ARE/ECN 115A</span></div>
        <nav aria-label="Lesson navigation">
          <a href="#guided">Guided case</a>
          <a href="#explore">Explore</a>
          <a href="#quick-check">Quick check</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <h1>Difference-in-Differences</h1>
          <div className="hero-formula" aria-label="Difference-in-differences expected-value formula">
            <span><BetaHat /><sub>DiD</sub> = </span>
            <span>[E(Y<sub>i1</sub><sup>post</sup> | D<sub>i</sub> = 1) − E(Y<sub>i0</sub><sup>pre</sup> | D<sub>i</sub> = 1)]</span>
            <span> − [E(Y<sub>i0</sub><sup>post</sup> | D<sub>i</sub> = 0) − E(Y<sub>i0</sub><sup>pre</sup> | D<sub>i</sub> = 0)]</span>
          </div>
          <a className="button primary hero-button" href="#study-background">Begin with Card & Krueger (1994) <span>↓</span></a>
        </div>
        <div className="hero-diagram" aria-label="A counterfactual outcome illustrated as a missing point">
          <svg viewBox="0 0 620 350" role="img" aria-label="Treated and comparison trajectories with a missing counterfactual outcome">
            <line className="hero-axis-line" x1="72" y1="32" x2="72" y2="304" />
            <line className="hero-axis-line" x1="72" y1="304" x2="570" y2="304" />
            <line className="hero-comparison-line" x1="142" y1="116" x2="500" y2="136" />
            <line className="hero-treated-line" x1="142" y1="220" x2="500" y2="154" />
            <line className="hero-counterfactual-line" x1="142" y1="220" x2="500" y2="240" />
            <rect className="hero-comparison-point" x="135" y="109" width="14" height="14" rx="2" />
            <rect className="hero-comparison-point" x="493" y="129" width="14" height="14" rx="2" />
            <circle className="hero-treated-point" cx="142" cy="220" r="7" />
            <circle className="hero-treated-point" cx="500" cy="154" r="7" />
            <circle className="hero-missing-ring" cx="500" cy="240" r="18" />
            <text className="hero-question" x="500" y="247" textAnchor="middle">?</text>
            <text className="hero-svg-label" x="142" y="328" textAnchor="middle">BEFORE</text>
            <text className="hero-svg-label" x="500" y="328" textAnchor="middle">AFTER</text>
          </svg>
        </div>
      </section>

      <section id="study-background" className="study-background" aria-labelledby="study-background-title">
        <div className="study-background-intro">
          <p className="eyebrow">The study</p>
          <h2 id="study-background-title">Did raising New Jersey’s minimum wage reduce fast-food employment?</h2>
          <p>Card and Krueger studied New Jersey’s April 1992 minimum-wage increase. They compared employment in New Jersey fast-food restaurants with employment in neighboring Pennsylvania, where the minimum wage did not change. <strong>This basic DiD design has exactly two groups and two time periods:</strong> New Jersey restaurants are the treated group and Pennsylvania restaurants are the comparison group; Feb–Mar 1992 is the pre-policy period and Nov–Dec 1992 is the post-policy period.</p>
          <a className="button ghost study-article-link" href={CARD.source} target="_blank" rel="noreferrer">{CARD.sourceLabel} <span aria-hidden="true">↗</span></a>
        </div>
        <div className="study-background-copy">
          <div className="background-variables" aria-label="Study treatment and outcome">
            <div><span>Treatment-group indicator</span><strong><i>D</i><sub>i</sub></strong><p><i>D</i><sub>i</sub> = 1 for New Jersey restaurants.<br /><i>D</i><sub>i</sub> = 0 for Pennsylvania restaurants.</p></div>
            <div><span>Outcome</span><strong><i>Y</i><sub>i</sub><sup>t</sup></strong><p><i>Y</i><sub>i</sub><sup>t</sup> is full-time-equivalent (FTE) employment in restaurant <i>i</i> during period <i>t</i>, where <i>t</i> is either Pre or Post. One part-time worker counts as 0.5 FTE, so two part-time workers count as one FTE.</p></div>
          </div>
          <div className="notation-note" aria-label="Potential-outcomes notation">
            <span>Potential-outcomes notation</span>
            <p><i>Y</i><sub>i0</sub><sup>t</sup> is restaurant <i>i</i>’s potential employment in period <i>t</i> without the policy; <i>Y</i><sub>i1</sub><sup>t</sup> is its potential employment with the policy. Before the wage increase, both groups are observed without the policy. Afterward, New Jersey is observed with the policy and Pennsylvania remains without it.</p>
            <div className="notation-example"><strong>How to read the notation</strong><span>E[<i>Y</i><sub>i0</sub><sup>Pre</sup> | <i>D</i><sub>i</sub> = 1]</span><p>Average pre-policy employment among New Jersey restaurants.</p></div>
          </div>
        </div>
      </section>

      <section className="why-did" aria-labelledby="why-did-title">
        <div>
          <p className="eyebrow">Why we need another causal tool</p>
          <h2 id="why-did-title">Why not randomly assign the minimum wage?</h2>
        </div>
        <div className="why-copy">
          <p>In an ideal experiment, researchers could randomly assign some states to raise their minimum wage and others not to. But the 1992 policy was chosen through New Jersey’s political process—not assigned by researchers.</p>
          <p>Because the policy was not randomly assigned, New Jersey and Pennsylvania may have had different employment levels even without the wage increase. Comparing their employment only after the policy would therefore not isolate the policy’s effect. DiD instead compares how employment changed in each state before and after the policy. The states do not need to begin at the same employment level. But we must assume that, without the policy, employment would have changed by the same amount in both states. This is the parallel-trends assumption.</p>
        </div>
      </section>

      <GuidedLesson />
      <ExploreCases selectedId={selectedExampleId} onSelectedIdChange={setSelectedExampleId} />
      <QuickDiagnostic key={selectedExampleId} selectedId={selectedExampleId} onSelectedIdChange={setSelectedExampleId} />

      <footer>
        <div className="footer-brand"><span className="brand-mark">ΔΔ</span><strong>DiD Lab</strong><span className="course-code">for ARE/ECN 115A</span></div>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
