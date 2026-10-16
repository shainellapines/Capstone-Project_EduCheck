const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

describe("Notifications: delete and clear read", () => {
    let t;
    let ownerId;
    before(async () => {
        t = await setup();
        ownerId = (await t.pool.query("SELECT user_id FROM users WHERE username='adviser_a'")).rows[0].user_id;
    });
    after(async () => t.teardown());

    const add = async (userId, status) =>
        (
            await t.pool.query(
                "INSERT INTO notifications (user_id, title, message, status) VALUES ($1,'Test','m',$2) RETURNING notification_id",
                [userId, status]
            )
        ).rows[0].notification_id;

    it("NOTIF-01 deletes only the caller's own notification", async () => {
        const mine = await add(ownerId, "Unread");

        const other = await t.request("DELETE", `/api/notifications/${mine}`, { token: t.tokens.subject_t });
        assert.equal(other.status, 404);

        const ok = await t.request("DELETE", `/api/notifications/${mine}`, { token: t.tokens.adviser_a });
        assert.equal(ok.status, 200);
        const left = await t.pool.query("SELECT 1 FROM notifications WHERE notification_id=$1", [mine]);
        assert.equal(left.rows.length, 0);
    });

    it("NOTIF-02 clear read removes read ones and keeps unread ones", async () => {
        const read = await add(ownerId, "Read");
        const unread = await add(ownerId, "Unread");
        const othersRead = await add(
            (await t.pool.query("SELECT user_id FROM users WHERE username='subject_t'")).rows[0].user_id,
            "Read"
        );

        const res = await t.request("DELETE", "/api/notifications/read", { token: t.tokens.adviser_a });
        assert.equal(res.status, 200);

        const ids = (await t.pool.query("SELECT notification_id FROM notifications")).rows.map((r) => r.notification_id);
        assert.ok(!ids.includes(read));
        assert.ok(ids.includes(unread));
        assert.ok(ids.includes(othersRead));
    });
});
