const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, PASSWORD } = require("./helpers/env");

describe("Authentication (EPIC-01)", () => {
    let t;
    before(async () => (t = await setup()));
    after(async () => t.teardown());

    it("AUTH-01 logs in with valid credentials and returns a JWT + user", async () => {
        const res = await t.request("POST", "/api/auth/login", { body: { username: "admin", password: PASSWORD } });
        assert.equal(res.status, 200);
        assert.ok(res.body.token);
        assert.equal(res.body.user.role, "admin");
        assert.equal(res.body.user.password_hash, undefined);
    });

    it("AUTH-02 rejects a wrong password with 401 and a generic message", async () => {
        const res = await t.request("POST", "/api/auth/login", { body: { username: "admin", password: "nope" } });
        assert.equal(res.status, 401);
        assert.match(res.body.message, /Invalid username or password/);
    });

    it("AUTH-03 rejects an unknown user with the same message (no user enumeration)", async () => {
        const res = await t.request("POST", "/api/auth/login", { body: { username: "ghost", password: "x" } });
        assert.equal(res.status, 401);
        assert.match(res.body.message, /Invalid username or password/);
    });

    it("AUTH-04 requires username and password", async () => {
        const res = await t.request("POST", "/api/auth/login", { body: { username: "admin" } });
        assert.equal(res.status, 400);
    });

    it("AUTH-05 blocks an inactive account with 403", async () => {
        await t.pool.query("UPDATE users SET status='Inactive' WHERE username='adviser_none'");
        const res = await t.request("POST", "/api/auth/login", {
            body: { username: "adviser_none", password: PASSWORD },
        });
        await t.pool.query("UPDATE users SET status='Active' WHERE username='adviser_none'");
        assert.equal(res.status, 403);
    });

    it("AUTH-06 protected routes reject a missing or malformed token with 401", async () => {
        assert.equal((await t.request("GET", "/api/auth/me")).status, 401);
        assert.equal((await t.request("GET", "/api/auth/me", { token: "not.a.jwt" })).status, 401);
    });

    it("AUTH-07 GET /me returns the caller's own account", async () => {
        const res = await t.request("GET", "/api/auth/me", { token: t.tokens.adviser_a });
        assert.equal(res.status, 200);
        assert.equal(res.body.user.username, "adviser_a");
    });

    it("AUTH-08 change-password enforces the complexity rule and the current password", async () => {
        const weak = await t.request("POST", "/api/auth/change-password", {
            token: t.tokens.principal,
            body: { current_password: PASSWORD, new_password: "short1" },
        });
        assert.equal(weak.status, 400);

        const wrongCurrent = await t.request("POST", "/api/auth/change-password", {
            token: t.tokens.principal,
            body: { current_password: "wrong", new_password: "LongEnough1" },
        });
        assert.equal(wrongCurrent.status, 401);

        const ok = await t.request("POST", "/api/auth/change-password", {
            token: t.tokens.principal,
            body: { current_password: PASSWORD, new_password: "LongEnough1" },
        });
        assert.equal(ok.status, 200);

        const relogin = await t.request("POST", "/api/auth/login", {
            body: { username: "principal", password: "LongEnough1" },
        });
        assert.equal(relogin.status, 200);
    });
    it("AUTH-09 login and /me give a teacher their name, profile and own assignments", async () => {
        const login = await t.request("POST", "/api/auth/login", { body: { username: "subject_t", password: PASSWORD } });
        assert.equal(login.status, 200);
        assert.equal(login.body.user.full_name, "Sam Subject");

        const me = await t.request("GET", "/api/auth/me", { token: t.tokens.subject_t });
        assert.equal(me.status, 200);
        assert.equal(me.body.user.full_name, "Sam Subject");
        assert.equal(me.body.profile.employee_number, "EMP-3");
        assert.equal(me.body.user.password_hash, undefined);

        // Seeded: English 4 in Mabini and Rizal, Mathematics 4 in Mabini - and nobody else's.
        const mine = me.body.assignments.map((a) => `${a.section_name}:${a.subject_name}`).sort();
        assert.deepEqual(mine, ["Mabini:English", "Mabini:Mathematics", "Rizal:English"]);
        assert.ok(me.body.assignments.every((a) => a.school_year && a.grade_level));
    });

    it("AUTH-10 Admin and Principal have no teacher profile: no name, no assignments", async () => {
        for (const role of ["admin", "principal"]) {
            const me = await t.request("GET", "/api/auth/me", { token: t.tokens[role] });
            assert.equal(me.status, 200);
            assert.equal(me.body.user.full_name, null);
            assert.equal(me.body.profile, null);
            assert.deepEqual(me.body.assignments, []);
        }
    });
});
