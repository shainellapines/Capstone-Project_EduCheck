const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

// Role-based access control (SPMP §6.2 / EPIC-01). Each row is an endpoint
// and the roles that must reach it; every other role must get 403, and no
// token must get 401. "Reach" means "not 401/403" - the handler may then
// answer 200/400/404 for the dummy ids used here.
const ALL = ["admin", "principal", "adviser_a", "subject_t"];

const MATRIX = [
    ["GET", "/api/users", ["admin"]],
    ["GET", "/api/teachers", ["admin"]],
    ["GET", "/api/assignments", ["admin"]],
    ["GET", "/api/audit-logs", ["admin"]],
    ["POST", "/api/sections", ["admin"]],
    ["GET", "/api/sections", ALL],
    ["GET", "/api/subjects", ALL],
    ["GET", "/api/assignments/mine", ALL],
    ["GET", "/api/notifications", ALL],
    ["GET", "/api/uploads/options", ["adviser_a", "subject_t"]],
    ["GET", "/api/uploads/my-records", ["adviser_a", "subject_t"]],
    ["GET", "/api/consolidation/school-years", ["admin", "principal", "adviser_a"]],
    ["GET", "/api/consolidation/school-years/1", ["admin", "principal", "adviser_a"]],
    ["GET", "/api/consolidation/school-years/1/sections", ["admin", "principal", "adviser_a"]],
    ["POST", "/api/consolidation/class-records/1/request-revision", ["adviser_a"]],
    ["GET", "/api/analytics/school-years/1", ["admin", "principal", "adviser_a"]],
    ["GET", "/api/repository/search?q=a", ["admin", "principal", "adviser_a"]],
    ["POST", "/api/submissions/school-years/1/submit-all", ["adviser_a"]],
    ["POST", "/api/submissions/school-years/1/students/000000000000/submit", ["adviser_a"]],
    ["POST", "/api/submissions/school-years/1/students/000000000000/approve", ["admin"]],
    ["POST", "/api/submissions/school-years/1/students/000000000000/reject", ["admin"]],
    ["POST", "/api/parser-test", ["admin"]],
    ["GET", "/api/sf10/settings", ["admin", "principal", "adviser_a"]],
    ["PUT", "/api/sf10/settings", ["admin"]],
    ["GET", "/api/sf10/students/000000000000", ["admin", "principal", "adviser_a"]],
    ["GET", "/api/sf10/students/000000000000/download", ["admin", "adviser_a"]],
    ["PUT", "/api/sf10/students/000000000000/history", ["admin", "adviser_a"]],
];

describe("Role-based access control matrix", () => {
    let t;
    before(async () => (t = await setup()));
    after(async () => t.teardown());

    for (const [method, url, allowed] of MATRIX) {
        it(`${method} ${url} - allowed: ${allowed.join(", ")}`, async () => {
            const anon = await t.request(method, url, { body: {} });
            assert.equal(anon.status, 401, "no token must be 401");

            for (const role of ALL) {
                const res = await t.request(method, url, { token: t.tokens[role], body: {} });
                if (allowed.includes(role)) {
                    assert.notEqual(res.status, 403, `${role} should be allowed`);
                    assert.notEqual(res.status, 401, `${role} should be authenticated`);
                } else {
                    assert.equal(res.status, 403, `${role} should be forbidden`);
                }
            }
        });
    }
});
