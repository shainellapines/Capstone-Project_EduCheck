const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

// Principal approval of accounts (migration 010): new accounts and role
// changes that give more access wait for the Principal.
describe("Accounts: Principal approval", () => {
    let t;
    before(async () => (t = await setup()));
    after(async () => t.teardown());

    const asAdmin = (method, path, body) => t.request(method, path, { token: t.tokens.admin, body });
    const asPrincipal = (method, path, body) => t.request(method, path, { token: t.tokens.principal, body });
    const login = (username, password) => t.request("POST", "/api/auth/login", { body: { username, password } });
    const idOf = async (username) =>
        (await t.pool.query("SELECT user_id FROM users WHERE username=$1", [username])).rows[0].user_id;
    const notices = async (username, title) =>
        (
            await t.pool.query(
                `SELECT n.message FROM notifications n JOIN users u USING (user_id)
                 WHERE u.username=$1 AND n.title=$2 ORDER BY n.notification_id`,
                [username, title]
            )
        ).rows.map((row) => row.message);

    const newTeacher = (username, n) => ({
        username,
        password: "Welcome123",
        email: `${username}@deped.gov.ph`,
        role: "subject",
        first_name: "Ana",
        last_name: `Teacher${n}`,
        employee_number: `EMP-80${n}`,
    });

    it("APR-01 a new account waits for the Principal and cannot sign in yet", async () => {
        const res = await asAdmin("POST", "/api/users", newTeacher("ana.one", 1));
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.user.status, "Pending Approval");

        const signIn = await login("ana.one", "Welcome123");
        assert.equal(signIn.status, 403);
        assert.match(signIn.body.message, /waiting for the Principal's approval/);

        const told = await notices("principal", "Account Awaiting Approval");
        assert.ok(told.some((message) => message.includes("Ana Teacher1")));
    });

    it("APR-02 the Administrator cannot activate it or approve it themselves", async () => {
        const id = await idOf("ana.one");
        assert.equal((await asAdmin("PUT", `/api/users/${id}`, { status: "Active" })).status, 409);
        assert.equal((await asAdmin("POST", `/api/account-approvals/${id}/approve`)).status, 403);

        const list = await asAdmin("GET", "/api/account-approvals");
        assert.equal(list.status, 200, "the Administrator may see the list");
        assert.ok(list.body.requests.some((r) => r.username === "ana.one" && r.request_type === "new_account"));
    });

    it("APR-03 once the Principal approves, it can sign in; the Administrator is told; it is audited", async () => {
        const id = await idOf("ana.one");
        const res = await asPrincipal("POST", `/api/account-approvals/${id}/approve`);
        assert.equal(res.status, 200, JSON.stringify(res.body));

        assert.equal((await login("ana.one", "Welcome123")).status, 200);
        assert.equal((await notices("admin", "Account Approved")).length, 1);

        const audit = await t.pool.query(
            "SELECT after_data FROM audit_logs WHERE entity_type='user' AND entity_id=$1 ORDER BY audit_log_id DESC LIMIT 1",
            [id]
        );
        assert.equal(audit.rows[0].after_data.approved, true);

        assert.equal((await asPrincipal("POST", `/api/account-approvals/${id}/approve`)).status, 409, "nothing left to approve");
    });

    it("APR-04 a rejection needs a reason; correcting the account sends it back", async () => {
        await asAdmin("POST", "/api/users", newTeacher("ana.two", 2));
        const id = await idOf("ana.two");

        assert.equal((await asPrincipal("POST", `/api/account-approvals/${id}/reject`, {})).status, 400);
        const rejected = await asPrincipal("POST", `/api/account-approvals/${id}/reject`, { remarks: "Wrong employee number." });
        assert.equal(rejected.status, 200);

        const signIn = await login("ana.two", "Welcome123");
        assert.equal(signIn.status, 403);
        assert.match(signIn.body.message, /not approved/);
        assert.ok((await notices("admin", "Account Not Approved"))[0].includes("Wrong employee number."));

        const fixed = await asAdmin("PUT", `/api/users/${id}`, {
            first_name: "Ana", last_name: "Teacher2", employee_number: "EMP-812",
        });
        assert.equal(fixed.status, 200, JSON.stringify(fixed.body));
        assert.equal(fixed.body.user.status, "Pending Approval");
        assert.equal(fixed.body.user.approval_remarks, null);
    });

    it("APR-05 a role change that gives more access waits; one that removes access applies at once", async () => {
        const id = await idOf("ana.one");
        const up = await asAdmin("PUT", `/api/users/${id}`, { role: "adviser" });
        assert.equal(up.status, 200);
        assert.equal(up.body.user.role, "subject", "keeps its current role meanwhile");
        assert.equal(up.body.user.pending_role, "adviser");

        assert.equal((await asPrincipal("POST", `/api/account-approvals/${id}/approve`)).status, 200);
        const after = (await t.pool.query("SELECT role, pending_role FROM users WHERE user_id=$1", [id])).rows[0];
        assert.deepEqual(after, { role: "adviser", pending_role: null });

        const down = await asAdmin("PUT", `/api/users/${id}`, { role: "subject" });
        assert.equal(down.body.user.role, "subject");
    });

    it("APR-06 the Principal cannot approve a change to their own account", async () => {
        const id = await idOf("principal");
        const up = await asAdmin("PUT", `/api/users/${id}`, { role: "admin" });
        assert.equal(up.body.user.pending_role, "admin");
        assert.equal((await asPrincipal("POST", `/api/account-approvals/${id}/approve`)).status, 409);
        await t.pool.query("UPDATE users SET pending_role=NULL WHERE user_id=$1", [id]);
    });

    it("APR-07 with no active Principal, a new account is active at once", async () => {
        await t.pool.query("UPDATE users SET status='Inactive' WHERE role='principal'");
        const res = await asAdmin("POST", "/api/users", newTeacher("ana.three", 3));
        await t.pool.query("UPDATE users SET status='Active' WHERE role='principal'");

        assert.equal(res.status, 201);
        assert.equal(res.body.user.status, "Active");
    });
});
