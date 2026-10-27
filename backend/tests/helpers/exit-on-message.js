// Loaded into the test server only during a coverage run (npm run coverage).
// On Windows, child.kill() ends the process at once and V8 never writes its
// coverage, so the tests ask the server to exit normally instead.
process.on("message", (message) => {
    if (message === "educheck:exit") process.exit(0);
});
