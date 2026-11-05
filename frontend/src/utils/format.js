// Averages always show two decimal places (90 -> "90.00", 89.5 -> "89.50").
export function formatGrade(value) {
    return value === null || value === undefined ? "—" : Number(value).toFixed(2);
}
