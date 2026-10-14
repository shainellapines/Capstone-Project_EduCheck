import { useLayoutEffect, useRef, useState } from "react";

// Hand-built SVG/HTML charts for the Analytics page (no chart library in
// the app). Colors come from the design system's chart tokens in App.css
// (--ec-chart-1 accent, --ec-chart-3 context gray, --ec-chart-grid), so
// light/dark mode follows the theme with no per-chart code.

// Width of a container, kept in sync on resize, so SVG text stays at its
// real size instead of scaling with a viewBox.
function useWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        if (!ref.current) return undefined;

        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.floor(entry.contentRect.width));
        });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return [ref, width];
}

// A grade axis that fits the data instead of always 0-100: grades sit in
// a narrow band, and a 0-based axis would flatten every difference. Lines
// and dots (never bars) are drawn on it, so a non-zero start is honest.
function gradeDomain(values, { includePassing, passingGrade, minSpan = 10 }) {
    const present = values.filter((value) => value !== null && value !== undefined);
    let low = Math.min(...present) - 2;
    let high = Math.max(...present) + 2;

    if (includePassing) low = Math.min(low, passingGrade - 3);

    low = Math.max(0, Math.floor(low / 5) * 5);
    high = Math.min(100, Math.ceil(high / 5) * 5);

    if (high - low < minSpan) {
        low = Math.max(0, high - minSpan);
    }

    return [low, high];
}

function gradeTicks([low, high]) {
    const step = high - low > 20 ? 10 : 5;
    const ticks = [];

    for (let value = Math.ceil(low / step) * step; value <= high; value += step) {
        ticks.push(value);
    }

    return ticks;
}

function formatGrade(value) {
    return value === null || value === undefined ? "—" : value.toFixed(2);
}

// ==========================================
// TERM TREND (line chart)
// ==========================================
// series: [{ key, label, tone: "accent" | "context", points: [{ term, average }] }]
// The accent series is the one the reader picked; the context series (the
// overall average) stays gray so the comparison never competes with it.
export function TermTrendChart({ series, passingGrade }) {
    const [ref, width] = useWidth();
    const [hoverIndex, setHoverIndex] = useState(null);

    const height = 260;
    const margin = { top: 20, right: 64, bottom: 36, left: 40 };
    const plotWidth = Math.max(0, width - margin.left - margin.right);
    const plotHeight = height - margin.top - margin.bottom;

    const terms = series[0]?.points.map((point) => point.term) || [];
    const allValues = series.flatMap((s) => s.points.map((point) => point.average));
    const domain = gradeDomain(allValues, { includePassing: false, passingGrade });
    const ticks = gradeTicks(domain);

    // Terms sit inside the plot with half a step of air on each side.
    const step = terms.length > 0 ? plotWidth / terms.length : 0;
    const x = (index) => margin.left + step * (index + 0.5);
    const y = (value) =>
        margin.top + plotHeight - ((value - domain[0]) / (domain[1] - domain[0])) * plotHeight;

    const showPassing = passingGrade >= domain[0] && passingGrade <= domain[1];

    const pathFor = (points) =>
        points
            .map((point, index) => (point.average === null ? null : `${x(index)},${y(point.average)}`))
            .filter(Boolean)
            .map((coords, index) => `${index === 0 ? "M" : "L"}${coords}`)
            .join(" ");

    const accent = series.find((s) => s.tone === "accent") || series[0];
    const accentPoints = accent.points
        .map((point, index) => ({ ...point, index }))
        .filter((point) => point.average !== null);
    const areaPath =
        accentPoints.length > 1
            ? `${pathFor(accent.points)} L${x(accentPoints[accentPoints.length - 1].index)},${margin.top + plotHeight} L${x(accentPoints[0].index)},${margin.top + plotHeight} Z`
            : null;

    // Direct label at each series' last point; when two end-labels would
    // collide, only the accent keeps its label (legend + tooltip carry the rest).
    const endLabels = series
        .map((s) => {
            const last = [...s.points].reverse().find((point) => point.average !== null);
            if (!last) return null;
            return { key: s.key, tone: s.tone, value: last.average, y: y(last.average) };
        })
        .filter(Boolean);

    if (endLabels.length === 2 && Math.abs(endLabels[0].y - endLabels[1].y) < 16) {
        endLabels.splice(endLabels.findIndex((label) => label.tone !== "accent"), 1);
    }

    const handlePointer = (event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const pointerX = event.clientX - bounds.left;
        const index = Math.round((pointerX - margin.left) / step - 0.5);
        setHoverIndex(index >= 0 && index < terms.length ? index : null);
    };

    const tooltipLeft = hoverIndex !== null ? x(hoverIndex) : 0;

    return (
        <div className="an-chart" ref={ref}>
            {series.length > 1 && (
                <ul className="an-legend">
                    {series.map((s) => (
                        <li key={s.key}>
                            <span className={`an-legend-line tone-${s.tone}`} aria-hidden="true" />
                            {s.label}
                        </li>
                    ))}
                </ul>
            )}

            {width > 0 && (
                <div className="an-chart-plot">
                    <svg
                        width={width}
                        height={height}
                        role="img"
                        aria-label={`Average grade by term: ${series
                            .map((s) => `${s.label} ${s.points.map((p) => `${p.term} ${formatGrade(p.average)}`).join(", ")}`)
                            .join("; ")}`}
                        onPointerMove={handlePointer}
                        onPointerLeave={() => setHoverIndex(null)}
                    >
                        {ticks.map((tick) => (
                            <g key={tick}>
                                <line
                                    className="an-grid"
                                    x1={margin.left}
                                    x2={margin.left + plotWidth}
                                    y1={y(tick)}
                                    y2={y(tick)}
                                />
                                <text className="an-axis-text" x={margin.left - 10} y={y(tick)} dy="0.35em" textAnchor="end">
                                    {tick}
                                </text>
                            </g>
                        ))}

                        {showPassing && (
                            <g>
                                <line
                                    className="an-passing-line"
                                    x1={margin.left}
                                    x2={margin.left + plotWidth}
                                    y1={y(passingGrade)}
                                    y2={y(passingGrade)}
                                />
                                <text className="an-passing-text" x={margin.left + plotWidth} y={y(passingGrade) - 6} textAnchor="end">
                                    Passing {passingGrade}
                                </text>
                            </g>
                        )}

                        {terms.map((term, index) => (
                            <text
                                key={term}
                                className={`an-axis-text${hoverIndex === index ? " is-active" : ""}`}
                                x={x(index)}
                                y={height - 12}
                                textAnchor="middle"
                            >
                                {term}
                            </text>
                        ))}

                        {hoverIndex !== null && (
                            <line
                                className="an-crosshair"
                                x1={x(hoverIndex)}
                                x2={x(hoverIndex)}
                                y1={margin.top}
                                y2={margin.top + plotHeight}
                            />
                        )}

                        {areaPath && <path className="an-area" d={areaPath} />}

                        {/* Context series first so the accent draws on top */}
                        {[
                            ...series.filter((s) => s.tone !== "accent"),
                            ...series.filter((s) => s.tone === "accent"),
                        ].map((s) => (
                                <g key={s.key} className={`an-series tone-${s.tone}`}>
                                    <path className="an-line" d={pathFor(s.points)} />
                                    {s.points.map((point, index) =>
                                        point.average === null ? null : (
                                            <circle
                                                key={point.term}
                                                className="an-dot"
                                                cx={x(index)}
                                                cy={y(point.average)}
                                                r={hoverIndex === index ? 6 : 4.5}
                                            />
                                        )
                                    )}
                                </g>
                            ))}

                        {endLabels.map((label) => (
                            <text
                                key={label.key}
                                className={`an-end-label tone-${label.tone}`}
                                x={margin.left + plotWidth + 10}
                                y={label.y}
                                dy="0.35em"
                            >
                                {formatGrade(label.value)}
                            </text>
                        ))}
                    </svg>

                    {hoverIndex !== null && (
                        <div
                            className={`an-tooltip${tooltipLeft > width / 2 ? " is-left" : ""}`}
                            style={{ left: tooltipLeft, top: margin.top }}
                            role="status"
                        >
                            <p className="an-tooltip-title">{terms[hoverIndex]}</p>
                            {series.map((s) => (
                                <p className="an-tooltip-row" key={s.key}>
                                    <span className={`an-legend-line tone-${s.tone}`} aria-hidden="true" />
                                    <strong>{formatGrade(s.points[hoverIndex].average)}</strong>
                                    <span>{s.label}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* The same numbers as a table, for screen readers */}
            <table className="an-sr-only">
                <caption>Average grade by term</caption>
                <thead>
                    <tr>
                        <th scope="col">Series</th>
                        {terms.map((term) => (
                            <th scope="col" key={term}>{term}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {series.map((s) => (
                        <tr key={s.key}>
                            <th scope="row">{s.label}</th>
                            {s.points.map((point) => (
                                <td key={point.term}>{formatGrade(point.average)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
// SUBJECT RANGE (dot plot)
// ==========================================
// One row per subject, best average first: a thin track from the lowest
// to the highest final grade in that subject, and a dot at the average.
// Shows both "which subject is weakest" and "how spread out it is", which
// the average alone hides. The table below it keeps every exact number.
export function SubjectRangeChart({ subjects, passingGrade }) {
    const [activeId, setActiveId] = useState(null);

    const sorted = [...subjects].sort(
        (a, b) => b.average_final_grade - a.average_final_grade || a.subject_name.localeCompare(b.subject_name)
    );

    const domain = gradeDomain(
        sorted.flatMap((subject) => [subject.lowest_final_grade, subject.highest_final_grade]),
        { includePassing: true, passingGrade, minSpan: 20 }
    );
    const ticks = gradeTicks(domain);
    const position = (value) => `${((value - domain[0]) / (domain[1] - domain[0])) * 100}%`;

    return (
        <div className="an-range-chart">
            <ul className="an-legend">
                <li>
                    <span className="an-legend-dot" aria-hidden="true" />
                    Average final grade
                </li>
                <li>
                    <span className="an-legend-range" aria-hidden="true" />
                    Lowest to highest grade
                </li>
            </ul>

            <div className="an-range-rows">
                {/* Gridlines + passing line span every row */}
                <div className="an-range-scale" aria-hidden="true">
                    {ticks.map((tick) => (
                        <span key={tick} className="an-range-grid" style={{ left: position(tick) }} />
                    ))}
                    <span className="an-range-passing" style={{ left: position(passingGrade) }} />
                    <span className="an-range-passing-label" style={{ left: position(passingGrade) }}>
                        Passing {passingGrade}
                    </span>
                </div>

                {sorted.map((subject) => {
                    const isActive = activeId === subject.subject_id;

                    return (
                        <div
                            className={`an-range-row${isActive ? " is-active" : ""}${subject.at_risk_count > 0 ? " has-risk" : ""}`}
                            key={subject.subject_id}
                            tabIndex={0}
                            onPointerEnter={() => setActiveId(subject.subject_id)}
                            onPointerLeave={() => setActiveId(null)}
                            onFocus={() => setActiveId(subject.subject_id)}
                            onBlur={() => setActiveId(null)}
                            aria-label={`${subject.subject_name}: average ${formatGrade(subject.average_final_grade)}, lowest ${subject.lowest_final_grade}, highest ${subject.highest_final_grade}, pass rate ${subject.pass_rate}%`}
                        >
                            <span className="an-range-label">{subject.subject_name}</span>

                            <span className="an-range-track">
                                <span
                                    className="an-range-span"
                                    style={{
                                        left: position(subject.lowest_final_grade),
                                        width: `calc(${position(subject.highest_final_grade)} - ${position(subject.lowest_final_grade)})`,
                                    }}
                                />
                                <span
                                    className="an-range-dot"
                                    style={{ left: position(subject.average_final_grade) }}
                                />

                                {isActive && (
                                    <span
                                        className={`an-tooltip an-range-tooltip${(subject.average_final_grade - domain[0]) / (domain[1] - domain[0]) > 0.6 ? " is-left" : ""}`}
                                        style={{ left: position(subject.average_final_grade) }}
                                        role="status"
                                    >
                                        <span className="an-tooltip-title">{subject.subject_name}</span>
                                        <span className="an-tooltip-row">
                                            <strong>{formatGrade(subject.average_final_grade)}</strong>
                                            <span>average</span>
                                        </span>
                                        <span className="an-tooltip-row">
                                            <strong>
                                                {subject.lowest_final_grade}–{subject.highest_final_grade}
                                            </strong>
                                            <span>range</span>
                                        </span>
                                        <span className="an-tooltip-row">
                                            <strong>{subject.pass_rate}%</strong>
                                            <span>pass rate · {subject.at_risk_count} at risk</span>
                                        </span>
                                    </span>
                                )}
                            </span>

                            <span className="an-range-value">{formatGrade(subject.average_final_grade)}</span>
                        </div>
                    );
                })}

                <div className="an-range-axis" aria-hidden="true">
                    {ticks.map((tick) => (
                        <span key={tick} style={{ left: position(tick) }}>
                            {tick}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
