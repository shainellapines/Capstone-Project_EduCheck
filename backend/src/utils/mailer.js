const fs = require("fs");
const nodemailer = require("nodemailer");

// Account emails (migration 011): the user's DepEd address receives their
// username and temporary password. Sent through the project's Gmail with an
// app password, set in .env:
//
//   SMTP_USER=educheckg10@gmail.com
//   SMTP_PASS=<16-character Gmail app password>
//   APP_URL=http://<server address>:5173      (optional, shown as the sign-in link)
//
// The school network may have no internet, so a failed send never blocks the
// action: the caller reports it and the Administrator hands the password over.
// MAIL_OUTBOX (tests only) writes each message to a file instead of sending.

const SEND_TIMEOUT_MS = 10000;

let transport = null;

const getTransport = () => {
    if (!transport) {
        transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT || 465),
            secure: Number(process.env.SMTP_PORT || 465) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            connectionTimeout: SEND_TIMEOUT_MS,
            greetingTimeout: SEND_TIMEOUT_MS,
            socketTimeout: SEND_TIMEOUT_MS,
        });
    }
    return transport;
};

// Resolves to { sent: true } or { sent: false, reason }; never throws.
const sendMail = async ({ to, subject, text }) => {
    if (process.env.MAIL_OUTBOX) {
        fs.appendFileSync(process.env.MAIL_OUTBOX, `${JSON.stringify({ to, subject, text })}\n`);
        return { sent: true };
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return { sent: false, reason: "Email sending is not set up on the server yet." };
    }

    try {
        await getTransport().sendMail({
            from: process.env.MAIL_FROM || `EduCheck <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
        });
        return { sent: true };
    } catch (error) {
        console.error("Send mail error:", error.message);
        return { sent: false, reason: "The email could not be sent. Check the server's internet connection." };
    }
};

const signInLine = () =>
    process.env.APP_URL ? `Sign in at ${process.env.APP_URL}` : "Sign in on the EduCheck website used by your school.";

const accountReadyEmail = ({ name, username, password, roleLabel }) => ({
    subject: "Your EduCheck account is ready",
    text: [
        `Good day, ${name}!`,
        "",
        `You have been added to EduCheck as ${roleLabel}. Your account was approved by the School Principal.`,
        "",
        `Username: ${username}`,
        `Temporary password: ${password}`,
        "",
        signInLine(),
        "You will be asked to replace the temporary password the first time you sign in.",
        "",
        "If you were not expecting this email, please tell your School Administrator.",
        "",
        "EduCheck",
    ].join("\n"),
});

const passwordResetEmail = ({ name, username, password }) => ({
    subject: "Your EduCheck password was reset",
    text: [
        `Good day, ${name}!`,
        "",
        "Your School Administrator reset your EduCheck password.",
        "",
        `Username: ${username}`,
        `Temporary password: ${password}`,
        "",
        signInLine(),
        "You will be asked to replace the temporary password the next time you sign in.",
        "",
        "If you did not ask for this, please tell your School Administrator.",
        "",
        "EduCheck",
    ].join("\n"),
});

module.exports = { sendMail, accountReadyEmail, passwordResetEmail };
