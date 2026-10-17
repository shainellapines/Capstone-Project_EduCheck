const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

// Accounts page: an account and its teacher profile are created and edited
// together, and new addresses must be DepEd emails.
describe("Accounts: account and teacher profile together", () => {
    let t;
    before(async () => (t = await setup()));
    after(async () => t.teardown());

    const create = (body) => t.request("POST", "/api/users", { token: t.tokens.admin, body });
    const update = (id, body) => t.request("PUT", `/api/users/${id}`, { token: t.tokens.admin, body });
    const countUsers = async (username) =>
        Number((await t.pool.query("SELECT COUNT(*) FROM users WHERE username=$1", [username])).rows[0].count);

    const teacher = {
        username: "juan.delacruz",
        password: "Welcome123",
        email: "juan.delacruz@deped.gov.ph",
        role: "subject",
        first_name: "Juan",
        last_name: "Dela Cruz",
        employee_number: "EMP-900",
        contact_number: "09170000000",
    };

    it("ACC-01 a teacher account is created with its profile in one step", async () => {
        const res = await create(teacher);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.user.first_name, "Juan");
        assert.equal(res.body.user.employee_number, "EMP-900");
        assert.ok(res.body.user.teacher_id);
    });

    it("ACC-02 a teacher account without name or employee number is refused, nothing saved", async () => {
        const res = await create({ ...teacher, username: "no.profile", email: "no.profile@deped.gov.ph", employee_number: "" });
        assert.equal(res.status, 400);
        assert.equal(await countUsers("no.profile"), 0);
    });

    it("ACC-03 a duplicate employee number rolls the account back too", async () => {
        const res = await create({ ...teacher, username: "maria.santos", email: "maria.santos@deped.gov.ph" });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /employee number/);
        assert.equal(await countUsers("maria.santos"), 0, "no account left without its profile");
    });

    it("ACC-04 the email must be a DepEd address", async () => {
        const res = await create({ ...teacher, username: "gmail.user", email: "gmail.user@gmail.com", employee_number: "EMP-901" });
        assert.equal(res.status, 400);
        assert.match(res.body.message, /@deped\.gov\.ph/);
    });

    it("ACC-05 an Admin or Principal account needs no teacher profile", async () => {
        const res = await create({ username: "new.principal", password: "Welcome123", email: "new.principal@deped.gov.ph", role: "principal" });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.user.teacher_id, null);
    });

    it("ACC-06 editing changes the profile; an old non-DepEd address may stay but not be newly set", async () => {
        const { rows } = await t.pool.query("SELECT user_id, email FROM users WHERE username='subject_t'");
        const { user_id: id, email: legacyEmail } = rows[0];

        const kept = await update(id, { email: legacyEmail, first_name: "Samuel", last_name: "Subject", employee_number: "EMP-3" });
        assert.equal(kept.status, 200, JSON.stringify(kept.body));
        assert.equal(kept.body.user.first_name, "Samuel");

        const changed = await update(id, { email: "someone@yahoo.com" });
        assert.equal(changed.status, 400);
    });

    it("ACC-07 the account list carries each teacher's name and employee number", async () => {
        const res = await t.request("GET", "/api/users", { token: t.tokens.admin });
        const juan = res.body.find((user) => user.username === "juan.delacruz");
        assert.equal(juan.last_name, "Dela Cruz");
        const admin = res.body.find((user) => user.username === "admin");
        assert.equal(admin.teacher_id, null);
    });
});
