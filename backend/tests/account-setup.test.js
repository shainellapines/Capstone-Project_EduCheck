const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

// Finishing an approved account (migration 011): the Administrator gives the
// employee number and a temporary password, and it is emailed to the DepEd
// address. Emails go to a test outbox file, never to a real address.
describe("Accounts: setup after approval and the account email", () => {
    let t;
    let id;
    before(async () => {
        t = await setup();
        const created = await t.request("POST", "/api/users", {
            token: t.tokens.admin,
            body: {
                username: "bea.reyes",
                email: "bea.reyes@deped.gov.ph",
                role: "adviser",
                first_name: "Bea",
                last_name: "Reyes",
            },
        });
        assert.equal(created.status, 201, JSON.stringify(created.body));
        id = created.body.user.user_id;
        assert.equal(created.body.user.employee_number, null, "no employee number before approval");
    });
    after(async () => t.teardown());

    const finish = (body) => t.request("POST", `/api/users/${id}/finish-setup`, { token: t.tokens.admin, body });

    it("SET-01 setup is refused until the Principal approves", async () => {
        const res = await finish({ employee_number: "EMP-700", temporary_password: "Temp12345" });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Principal has to approve/);
    });

    it("SET-02 after approval, a teacher needs an employee number and a valid temporary password", async () => {
        assert.equal(
            (await t.request("POST", `/api/account-approvals/${id}/approve`, { token: t.tokens.principal })).status,
            200
        );

        assert.equal((await finish({ temporary_password: "Temp12345" })).status, 400);
        assert.equal((await finish({ employee_number: "EMP-700", temporary_password: "short" })).status, 400);
        assert.equal((await finish({ employee_number: "EMP-1", temporary_password: "Temp12345" })).status, 409, "EMP-1 is taken");
        assert.equal((await t.pool.query("SELECT status FROM users WHERE user_id=$1", [id])).rows[0].status, "Awaiting Setup");
    });

    it("SET-03 setup activates the account and emails the username and temporary password", async () => {
        const res = await finish({ employee_number: "EMP-700", temporary_password: "Temp12345" });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.email_sent, true);
        assert.equal(res.body.user.status, "Active");
        assert.equal(res.body.user.employee_number, "EMP-700");

        const mail = t.readOutbox().find((m) => m.to === "bea.reyes@deped.gov.ph");
        assert.ok(mail, "an email went to the DepEd address");
        assert.match(mail.subject, /account is ready/);
        assert.match(mail.text, /Username: bea\.reyes/);
        assert.match(mail.text, /Temporary password: Temp12345/);

        const row = (await t.pool.query("SELECT must_change_password FROM users WHERE user_id=$1", [id])).rows[0];
        assert.equal(row.must_change_password, true);

        const signIn = await t.request("POST", "/api/auth/login", { body: { username: "bea.reyes", password: "Temp12345" } });
        assert.equal(signIn.status, 200);

        assert.equal((await finish({ employee_number: "EMP-700", temporary_password: "Temp12345" })).status, 409, "already set up");
    });

    it("SET-04 a password reset is emailed too and is temporary", async () => {
        const res = await t.request("POST", `/api/users/${id}/reset-password`, {
            token: t.tokens.admin,
            body: { new_password: "Again1234" },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.email_sent, true);
        const mail = t.readOutbox().filter((m) => m.to === "bea.reyes@deped.gov.ph").pop();
        assert.match(mail.subject, /password was reset/);
        assert.match(mail.text, /Temporary password: Again1234/);
    });

    it("SET-05 the audit log records the setup without the password", async () => {
        const rows = (
            await t.pool.query("SELECT after_data FROM audit_logs WHERE entity_type='user' AND entity_id=$1", [id])
        ).rows.map((r) => JSON.stringify(r.after_data));
        assert.ok(rows.some((r) => r.includes('"setup_finished":true')));
        assert.ok(rows.every((r) => !r.includes("Temp12345") && !r.includes("Again1234")));
    });

    it("SET-06 a temporary password must be replaced before anything else works", async () => {
        const signIn = await t.request("POST", "/api/auth/login", { body: { username: "bea.reyes", password: "Again1234" } });
        assert.equal(signIn.status, 200);
        assert.equal(signIn.body.user.must_change_password, true);
        const token = signIn.body.token;

        const blocked = await t.request("GET", "/api/notifications", { token });
        assert.equal(blocked.status, 403);
        assert.equal(blocked.body.code, "PASSWORD_CHANGE_REQUIRED");
        assert.equal((await t.request("GET", "/api/auth/me", { token })).body.user.must_change_password, true);

        const change = (current_password, new_password) =>
            t.request("POST", "/api/auth/change-password", { token, body: { current_password, new_password } });

        assert.equal((await change("Again1234", "Again1234")).status, 400, "the temporary one cannot be kept");
        assert.equal((await change("typo", "MyOwnPass9")).status, 400, "a typo does not end the session");
        assert.equal((await change("Again1234", "MyOwnPass9")).status, 200);

        assert.equal((await t.request("GET", "/api/notifications", { token })).status, 200);
        const relogin = await t.request("POST", "/api/auth/login", { body: { username: "bea.reyes", password: "MyOwnPass9" } });
        assert.equal(relogin.body.user.must_change_password, false);
    });
});
