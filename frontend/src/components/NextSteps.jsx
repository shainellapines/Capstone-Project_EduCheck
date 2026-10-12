import { ArrowRight, Check, Clock, CircleDot } from "lucide-react";
import "./NextSteps.css";

// "What to do next" panel for the Adviser and Subject Teacher dashboards:
// the stages of their job, in order, each with its progress, the one
// thing blocking it, and a link to where that gets done.
//
// step = {
//   key, title,
//   state: "done" | "active" | "waiting",
//   value, total,            // "7 of 8"
//   unit,                    // "subjects validated"
//   segments: [{ value, tone: "done" | "warning" | "pending" }],
//   detail,                  // one short line: what's left
//   action: { label, onClick } | null,
// }

const STATE_ICON = {
    done: Check,
    active: CircleDot,
    waiting: Clock,
};

const STATE_LABEL = {
    done: "Done",
    active: "To do",
    waiting: "Waiting",
};

function NextSteps({ title = "Next steps", context, steps }) {
    return (
        <section className="ns-card" aria-label={title}>
            <header className="ns-head">
                <h2>{title}</h2>
                {context && <span className="ns-context">{context}</span>}
            </header>

            <ol className="ns-steps" style={{ "--ns-count": steps.length }}>
                {steps.map((step, index) => {
                    const Icon = STATE_ICON[step.state] || CircleDot;
                    const segmentTotal = Math.max(step.total, 1);

                    return (
                        <li className={`ns-step is-${step.state}`} key={step.key}>
                            <div className="ns-step-top">
                                <span className="ns-step-index" aria-hidden="true">
                                    {step.state === "done" ? <Check size={13} strokeWidth={3} /> : index + 1}
                                </span>
                                <h3>{step.title}</h3>
                                <span className="ns-state">
                                    <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
                                    {STATE_LABEL[step.state]}
                                </span>
                            </div>

                            <p className="ns-value">
                                <strong>{step.value}</strong>
                                <span>
                                    of {step.total} {step.unit}
                                </span>
                            </p>

                            <div
                                className="ns-bar"
                                role="img"
                                aria-label={`${step.value} of ${step.total} ${step.unit}`}
                            >
                                {step.segments
                                    .filter((segment) => segment.value > 0)
                                    .map((segment) => (
                                        <span
                                            key={segment.tone}
                                            className={`ns-bar-fill tone-${segment.tone}`}
                                            style={{ width: `${(segment.value / segmentTotal) * 100}%` }}
                                        />
                                    ))}
                            </div>

                            <p className="ns-detail">{step.detail}</p>

                            {step.action && (
                                <button type="button" className="ns-action" onClick={step.action.onClick}>
                                    {step.action.label}
                                    <ArrowRight size={14} aria-hidden="true" />
                                </button>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

export default NextSteps;
