"use client";

import { useMemo, useState } from "react";

type Example = {
  id: string;
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
  source: string;
  sourceLabel: string;
  note: string;
};

const CARD: Example = {
  id: "card-krueger",
  title: "Did raising New Jersey’s minimum wage reduce fast-food employment?",
  policy: "New Jersey raised its minimum wage from $4.25 to $5.05 on April 1, 1992.",
  treated: "New Jersey",
  comparison: "Pennsylvania",
  before: "Feb–Mar 1992",
  after: "Nov–Dec 1992",
  outcome: "FTE employees per restaurant",
  unit: "FTE",
  values: [20.4, 21.0, 23.3, 21.2],
  range: [18, 23.6],
  source: "https://www.jstor.org/stable/2118030",
  sourceLabel: "Read the published article",
  note: "The graph uses the paper’s rounded state means. The paper reports a simple DiD of 2.76 FTE employees.",
};

const STEPS = [
  {
    kicker: "The policy problem",
    question: "What would employment in New Jersey restaurants have been without the wage increase?",
    explanation: "We observe employment after New Jersey raised its minimum wage. To measure the effect, we also need to know what employment would have been in those same restaurants, at the same time, if the wage had not increased. We cannot observe that no-policy outcome directly; it is the counterfactual.",
  },
  {
    kicker: "A tempting first answer",
    question: "Employment rose from 20.4 to 21.0. Is +0.6 the policy effect?",
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
    explanation: "New Jersey employment changed by +0.6 FTE, while Pennsylvania employment changed by −2.1 FTE. At this point, these are simply two observed changes; we have not yet used Pennsylvania’s change to estimate New Jersey’s counterfactual.",
  },
  {
    kicker: "Estimate the counterfactual",
    question: "If untreated trends were parallel, where would New Jersey employment have ended?",
    explanation: "Under parallel trends, we assume that without the policy New Jersey would have experienced the same −2.1 FTE change as Pennsylvania. Applying that change to New Jersey’s 20.4 FTE baseline gives an estimated counterfactual of 18.3 FTE. This outcome is unobserved and cannot be verified directly because New Jersey was actually treated in the post period.",
  },
  {
    kicker: "Reveal the estimated effect",
    question: "How far is observed New Jersey employment above its counterfactual?",
    explanation: "Observed New Jersey employment is 21.0 FTE; its counterfactual is 18.3 FTE. The estimated policy effect is therefore 21.0 − 18.3 = +2.7 FTE employees per restaurant.",
  },
  {
    kicker: "Name the estimator",
    question: "Why is this a difference in differences?",
    explanation: "First, calculate the change from pre to post in each state. Then subtract Pennsylvania’s change from New Jersey’s change. The result is the +2.7 FTE estimated policy effect.",
  },
];

function fmt(value: number, unit: string) {
  const digits = Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(digits)}${unit === "%" ? "%" : ""}`;
}

function BetaHat() {
  return <span className="beta-hat" role="img" aria-label="beta hat"><span aria-hidden="true">β</span></span>;
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
  const showT1 = reveal >= 1;
  const showC1 = reveal >= 2;
  const showC0 = reveal >= 2;
  const showCounterfactual = reveal >= 5;
  const showEffect = reveal >= 6;
  const effectMidY = (y(t1) + y(counterfactual)) / 2;

  return (
    <figure className="chart-shell">
      <svg viewBox="0 0 620 350" role="img" aria-labelledby={`chart-${example.id}-title chart-${example.id}-desc`}>
        <title id={`chart-${example.id}-title`}>{example.title}</title>
        <desc id={`chart-${example.id}-desc`}>
          {example.treated} changes from {t0} to {t1}; {example.comparison} changes from {c0} to {c1}. The difference-in-differences estimate is {fmt((t1 - t0) - (c1 - c0), example.unit)}.
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
        <text x="306" y="40" textAnchor="middle" className="policy-label">policy / exposure</text>
        <line x1="306" x2="306" y1="48" y2="282" className="policy-line" />
        <text x={x0} y="318" textAnchor="middle" className="axis-title">{example.before}</text>
        <text x={x1} y="318" textAnchor="middle" className="axis-title">{example.after}</text>

        {showT1 && <line x1={x0} y1={y(t0)} x2={x1} y2={y(t1)} className="treated-line" />}
        {showC0 && showC1 && <line x1={x0} y1={y(c0)} x2={x1} y2={y(c1)} className="comparison-line" />}
        {showCounterfactual && <line x1={x0} y1={y(t0)} x2={x1} y2={y(counterfactual)} className="counterfactual-line" />}
        {untreatedChange !== undefined && !pathsMatch && <line x1={x0} y1={y(t0)} x2={x1} y2={y(trueCounterfactual)} className="true-counterfactual-line" />}

        <circle cx={x0} cy={y(t0)} r="4" className="treated-point" />
        <text x={x0 - 8} y={y(t0) + 4} textAnchor="end" className="value-label treated-text">{fmt(t0, example.unit)}</text>
        {showT1 && <circle cx={x1} cy={y(t1)} r="4" className="treated-point" />}
        {showT1 && <text x={x1 + 10} y={y(t1) + 16} className="value-label treated-text">{fmt(t1, example.unit)}</text>}

        {showC0 && <rect x={x0 - 4} y={y(c0) - 4} width="8" height="8" rx="1" className="comparison-point" />}
        {showC0 && <text x={x0 - 8} y={y(c0) + 4} textAnchor="end" className="value-label comparison-text">{fmt(c0, example.unit)}</text>}
        {showC1 && <rect x={x1 - 4} y={y(c1) - 4} width="8" height="8" rx="1" className="comparison-point" />}
        {showC1 && <text x={x1 + 10} y={y(c1) - 8} className="value-label comparison-text">{fmt(c1, example.unit)}</text>}

        {showCounterfactual && <circle cx={x1} cy={y(counterfactual)} r="8" className="counterfactual-point" />}
        {showCounterfactual && <text x={x1 - 12} y={y(counterfactual) + 5} textAnchor="end" className="value-label counterfactual-text">Counterfactual {fmt(counterfactual, example.unit)}</text>}

        {untreatedChange !== undefined && !pathsMatch && <circle cx={x1} cy={y(trueCounterfactual)} r="7" className="true-counterfactual-point" />}
        {untreatedChange !== undefined && !pathsMatch && <text x={x1 - 12} y={y(trueCounterfactual) + 18} textAnchor="end" className="value-label true-text">Counterfactual when the parallel trends assumption is violated {fmt(trueCounterfactual, example.unit)}</text>}

        {showEffect && (
          <g className="effect-bracket">
            <line x1="522" x2="522" y1={y(t1)} y2={y(counterfactual)} />
            <line x1="513" x2="531" y1={y(t1)} y2={y(t1)} />
            <line x1="513" x2="531" y1={y(counterfactual)} y2={y(counterfactual)} />
            <text x="536" y={effectMidY - 3}>β</text>
            <path d={`M536 ${effectMidY - 15} L540 ${effectMidY - 18} L544 ${effectMidY - 15}`} className="svg-beta-hat" />
            <text x="548" y={effectMidY - 3}>= {fmt((t1 - t0) - comparisonChange, example.unit)}</text>
            <text x="536" y={effectMidY + 11}>(DiD estimate)</text>
          </g>
        )}
      </svg>
      <figcaption className="legend" aria-label="Graph legend">
        <span><i className="legend-dot treated-dot" />{example.treated} (Treated)</span>
        <span><i className="legend-square comparison-square" />{example.comparison} (Comparison)</span>
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
      <div className="progress-row" aria-label={`Lesson step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((_, index) => (
          <button key={index} className={index === step ? "progress-step active" : index < step ? "progress-step done" : "progress-step"} onClick={() => move(index)} aria-label={`Go to step ${index + 1}`} aria-current={index === step ? "step" : undefined}>
            {index + 1}
          </button>
        ))}
      </div>

      <div className="lesson-grid">
        <div>
          <h3 id="guided-title">{CARD.title}</h3>
          <p className="policy-copy">{CARD.policy}</p>
          <div className="study-setup" aria-label="Study variables">
            <div><span>Treatment</span><strong>New Jersey’s minimum-wage increase</strong><small><i>D</i><sub>i</sub> = 1 for New Jersey restaurants; 0 for Pennsylvania restaurants</small></div>
            <div><span>Outcome</span><strong>Employment per restaurant</strong><small><i>Y</i><sub>it</sub> = full-time-equivalent employment in restaurant <i>i</i> at time <i>t</i></small></div>
          </div>
          <OutcomeGraph example={CARD} values={CARD.values} reveal={step} />
          <p className="source-note">{CARD.note} <a href={CARD.source} target="_blank" rel="noreferrer">{CARD.sourceLabel} ↗</a></p>
        </div>

        <aside className="teaching-panel" aria-live="polite">
          <span className="step-count">Step {step + 1} of {STEPS.length}</span>
          <p className="panel-kicker">{current.kicker}</p>
          <h3>{current.question}</h3>
          <p>{current.explanation}</p>

          {step === 5 && (
            <div className="formula-card worked-counterfactual">
              <p>Estimated counterfactual under parallel trends</p>
              <strong>20.4 − 2.1 = 18.3 FTE</strong>
              <span>Unobserved: New Jersey baseline + Pennsylvania change</span>
            </div>
          )}

          {step === 7 && (
            <div className="formula-card expected-value-formula">
              <p>Difference in differences</p>
              <div className="math-line">
                <span><BetaHat /><sub>DiD</sub> = </span>
                <span className="math-group">[E(Y<sub>i</sub><sup>post</sup> | D<sub>i</sub> = 1) − E(Y<sub>i</sub><sup>pre</sup> | D<sub>i</sub> = 1)]</span>
                <span> − </span>
                <span className="math-group">[E(Y<sub>i</sub><sup>post</sup> | D<sub>i</sub> = 0) − E(Y<sub>i</sub><sup>pre</sup> | D<sub>i</sub> = 0)]</span>
              </div>
              <strong>(21.0 − 20.4) − (21.2 − 23.3)</strong>
              <span>= 0.6 − (−2.1) = 2.7 FTE</span>
              <small>D<sub>i</sub> = 1: New Jersey · D<sub>i</sub> = 0: Pennsylvania</small>
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
            <p>Compares the two states after the policy: New Jersey 21.0 − Pennsylvania 21.2 = −0.2 FTE. It ignores their pre-policy difference.</p>
          </article>
          <article>
            <span>New Jersey before–after</span>
            <strong>+0.6 FTE</strong>
            <p>The change may reflect both the policy effect and anything else that changed over time.</p>
          </article>
          <article className="selected-estimator">
            <span>Difference in differences</span>
            <strong>+2.7 FTE</strong>
            <p>Subtracts Pennsylvania’s −2.1 FTE change from New Jersey’s +0.6 FTE change: 0.6 − (−2.1) = 2.7 FTE.</p>
          </article>
        </div>
      )}
    </section>
  );
}

function ExploreCases() {
  const selected = CARD;
  const [values, setValues] = useState<[number, number, number, number]>(CARD.values);
  const [trendDeviation, setTrendDeviation] = useState(0);

  const reset = () => {
    setValues(CARD.values);
    setTrendDeviation(0);
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
          <h2 id="explore-title">Now experiment with the minimum-wage example</h2>
          <p className="section-intro">Move the four observed employment outcomes, then introduce a deviation from parallel trends to see how it changes the counterfactual and the resulting estimate.</p>
        </div>
      </div>

      <div className="explore-grid">
        <div>
          <h3>How does the DiD estimate change?</h3>
          <p className="policy-copy">The orange and green paths show observed outcomes. The <strong>(unobserved) gold line</strong> shows the counterfactual under parallel trends: New Jersey’s baseline plus Pennsylvania’s change. Move the red control to examine what happens when the parallel trends assumption is violated.</p>
          <OutcomeGraph example={selected} values={values} untreatedChange={untreatedChange} />
          <p className="source-note">The default values reproduce the paper’s rounded state means. Adjusted values are teaching simulations, not alternative estimates from the paper.</p>
        </div>

        <aside className="controls-panel">
          <div className="live-results" aria-live="polite">
            <div><span>DiD estimate</span><strong>{fmt(did, selected.unit)}</strong></div>
            <div><span>Effect implied by selected counterfactual</span><strong>{fmt(trueEffect, selected.unit)}</strong></div>
            <div><span>Bias</span><strong>{fmt(bias, selected.unit)}</strong></div>
          </div>

          <p className="control-heading">Move the four observed outcomes</p>
          {[
            { label: `${selected.treated} · ${selected.before}`, period: "pre", treatment: 1 },
            { label: `${selected.treated} · ${selected.after}`, period: "post", treatment: 1 },
            { label: `${selected.comparison} · ${selected.before}`, period: "pre", treatment: 0 },
            { label: `${selected.comparison} · ${selected.after}`, period: "post", treatment: 0 },
          ].map(({ label, period, treatment }, index) => (
            <label className="range-control" key={label}>
              <span className="control-label"><span>{label}<em>E[Y<sub>i</sub><sup>{period}</sup> | D<sub>i</sub> = {treatment}]</em></span><b>{fmt(values[index], selected.unit)}</b></span>
              <input type="range" min={selected.range[0]} max={selected.range[1]} step={selected.unit === "%" ? 1 : 0.1} value={values[index]} onChange={(event) => update(index, Number(event.target.value))} />
            </label>
          ))}

          <label className="range-control assumption-control">
            <span>Deviation from parallel trends<b>{fmt(trendDeviation, selected.unit)}</b></span>
            <input type="range" min="-4" max="4" step="0.1" value={trendDeviation} onChange={(event) => setTrendDeviation(Number(event.target.value))} />
          </label>
          <div className={Math.abs(trendDeviation) < 0.051 ? "trend-status parallel" : "trend-status biased"}>
            {Math.abs(trendDeviation) < 0.051 ? "The parallel trends assumption holds: the two counterfactuals coincide, so the DiD estimate equals the selected policy effect." : `The parallel trends assumption is violated. The red counterfactual differs from the gold counterfactual by ${fmt(trendDeviation, selected.unit)}, so the DiD estimate differs from the selected policy effect by ${fmt(bias, selected.unit)}.`}
          </div>
          <p className="control-help">The gold line is the counterfactual under parallel trends. At zero deviation, the red line coincides with it. Changing any observed outcome moves both lines together; moving this red control separates them.</p>
          <button className="button secondary full" onClick={reset}>Reset the minimum-wage example</button>
        </aside>
      </div>
    </section>
  );
}

function Concepts() {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const questions = useMemo(() => [
    { statement: "Treated and comparison groups must begin at the same outcome level.", answer: false, why: "Different levels are allowed. DiD needs a credible claim about untreated changes." },
    { statement: "Similar pre-treatment trends prove what the post-treatment counterfactual would have been.", answer: false, why: "They can make the parallel trends assumption more plausible, but they cannot prove an unobserved post-treatment path." },
    { statement: "A shock affecting only the treated group at the policy date can bias a DiD estimate.", answer: true, why: "Yes. DiD cannot distinguish the policy from another simultaneous shock affecting only the treated group." },
  ], []);

  return (
    <section id="assumptions" className="lesson-section concepts-section" aria-labelledby="assumptions-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 · Assumptions</p>
          <h2 id="assumptions-title">What cancels in DiD—and what can still create bias</h2>
        </div>
      </div>

      <div className="concept-grid">
        <article>
          <span className="concept-number">01</span>
          <h3>Time-invariant outcome differences are removed</h3>
          <p>New Jersey and Pennsylvania can begin with different average employment levels. When we calculate each state’s change from before to after, a gap that would have remained constant over time drops out algebraically.</p>
        </article>
        <article>
          <span className="concept-number">02</span>
          <h3>Shared time shocks cancel</h3>
          <p>Changes affecting both states equally—such as a common seasonal pattern or nationwide recession shock—appear in both first differences and cancel when one change is subtracted from the other.</p>
        </article>
        <article className="warning-concept">
          <span className="concept-number">03</span>
          <h3>Differential changes do not cancel</h3>
          <p>A New Jersey-specific demand shock, another policy introduced at the same time, changes in restaurant composition, anticipation, or spillovers can cause untreated employment to change differently across states. These violations can make the DiD estimate differ from the true policy effect.</p>
        </article>
      </div>

      <div className="selection-rule">
        <strong>The precise claim</strong>
        <p>Taking differences removes <em>time-invariant differences in average outcome levels</em> and common time shocks. It does not solve selection or confounding that makes untreated outcomes change differently across groups. The parallel trends assumption rules out those differential untreated changes.</p>
      </div>

      <div className="quiz-block">
        <div>
          <p className="panel-kicker">Quick diagnostic</p>
          <h3>Would you make these claims?</h3>
        </div>
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
  return (
    <main data-version="17">
      <header className="site-header">
        <div className="brand-group"><a className="brand" href="#top" aria-label="DiD Lab home"><span className="brand-mark">ΔΔ</span><span className="brand-title">DiD Lab</span></a><span className="course-code">ARE/ECN 115A</span></div>
        <nav aria-label="Lesson navigation">
          <a href="#guided">Guided case</a>
          <a href="#explore">Explore</a>
          <a href="#assumptions">Assumptions</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <h1>Difference-in-Differences</h1>
          <div className="hero-formula" aria-label="Difference-in-differences expected-value formula">
            <span><BetaHat /><sub>DiD</sub> = </span>
            <span>[E(Y<sub>i</sub><sup>post</sup> | D<sub>i</sub> = 1) − E(Y<sub>i</sub><sup>pre</sup> | D<sub>i</sub> = 1)]</span>
            <span> − [E(Y<sub>i</sub><sup>post</sup> | D<sub>i</sub> = 0) − E(Y<sub>i</sub><sup>pre</sup> | D<sub>i</sub> = 0)]</span>
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
        <div>
          <p className="eyebrow">The study</p>
          <h2 id="study-background-title">Did raising New Jersey’s minimum wage reduce fast-food employment?</h2>
        </div>
        <div className="study-background-copy">
          <p>Card and Krueger studied New Jersey’s April 1992 minimum-wage increase. They compared employment in New Jersey fast-food restaurants with employment in neighboring Pennsylvania, where the minimum wage did not change. <strong>This example has exactly two time periods:</strong> Feb–Mar 1992 before the policy and Nov–Dec 1992 after the policy.</p>
          <a className="button ghost study-article-link" href={CARD.source} target="_blank" rel="noreferrer">{CARD.sourceLabel} <span aria-hidden="true">↗</span></a>
          <div className="background-variables" aria-label="Study treatment and outcome">
            <div><span>Treatment indicator</span><strong><i>D</i><sub>i</sub> = 1</strong><p>Restaurant <i>i</i> is in New Jersey and was exposed to the wage increase. <i>D</i><sub>i</sub> = 0 for Pennsylvania restaurants.</p></div>
            <div><span>Outcome</span><strong><i>Y</i><sub>it</sub></strong><p>Full-time-equivalent (FTE) employment in restaurant <i>i</i> during period <i>t</i>. In this measure, one part-time worker counts as 0.5 FTE, so two part-time workers count as one FTE.</p></div>
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
          <p><i>D</i><sub>i</sub> records whether restaurant <i>i</i> is located in New Jersey, the treated state, or Pennsylvania, the comparison state. A restaurant’s location may be associated with characteristics such as customer demand, urbanization, baseline labor-market conditions, or recession exposure. Those characteristics can also affect employment without the policy, <i>Y</i><sub>it</sub>(0). DiD allows the states to begin at different employment levels, but requires that their average untreated employment would have <strong>changed by the same amount</strong>.</p>
        </div>
      </section>

      <div className="thesis-strip">
        <span>PARALLEL TRENDS</span>
        <p>Without the policy, assume average employment in New Jersey would have changed by the same amount as average employment in Pennsylvania.</p>
      </div>

      <GuidedLesson />
      <ExploreCases />
      <Concepts />

      <footer>
        <div className="footer-brand"><span className="brand-mark">ΔΔ</span><strong>DiD Lab</strong><span className="course-code">ARE/ECN 115A</span></div>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
