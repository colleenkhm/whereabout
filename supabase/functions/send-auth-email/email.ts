// Sign-in code emails for the Send Email hook. Code only, no link (see HANDOFF.md 2026-11-25).

export interface AuthEmail {
  subject: string;
  html: string;
  text: string;
}

// signInWithOtp sends "signup" for a new email, "magiclink" for an existing one.
// "reauthentication" is a plain code too. Anything else isn't used by whereabout.
export type CodeAction = "signup" | "magiclink" | "reauthentication";

export const isCodeAction = (a: string): a is CodeAction =>
  a === "signup" || a === "magiclink" || a === "reauthentication";

const COPY: Record<CodeAction, { subject: string; heading: string; intro: string; ignore: string }> = {
  signup: {
    subject: "Finish creating your whereabout account",
    heading: "Welcome to whereabout",
    intro: "You asked to create a whereabout account with this email. Enter this code on whereabout to finish, and you'll be signed in.",
    ignore: "No account is created unless the code is used.",
  },
  magiclink: {
    subject: "Your whereabout sign-in code",
    heading: "Sign in to whereabout",
    intro: "Enter this code on whereabout to sign in. No password needed.",
    ignore: "Nobody can sign in without the code.",
  },
  reauthentication: {
    subject: "Your whereabout confirmation code",
    heading: "Confirm it's you",
    intro: "Enter this code on whereabout to confirm the change.",
    ignore: "Nothing changes without the code.",
  },
};

const NOTE = "The code works once and expires after an hour. You can type it on any device.";

export function renderCodeEmail(action: CodeAction, token: string): AuthEmail {
  if (!/^\d{6,10}$/.test(token)) throw new Error("Unexpected token format");
  const c = COPY[action];
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1.5px solid #1a1520;border-radius:8px;">
        <tr>
          <td style="background:#1a1520;color:#ffffff;padding:14px 24px;border-radius:6px 6px 0 0;font-family:Georgia,serif;font-size:20px;font-weight:bold;">whereabout</td>
        </tr>
        <tr>
          <td style="padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1a1520;">
            <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;font-weight:bold;">${c.heading}</p>
            <p style="margin:0 0 20px;">${c.intro}</p>
            <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:8px;color:#1a1520;background:#f4efe6;border:1.5px dashed #1a1520;border-radius:4px;padding:14px 0;text-align:center;">${token}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#55505a;">${NOTE}</p>
            <p style="margin:0;font-size:14px;color:#55505a;">Didn't ask for this? You can ignore this email. ${c.ignore}</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#55505a;">whereabout · <a href="https://www.whereabout.world" style="color:#55505a;">whereabout.world</a></p>
    </td>
  </tr>
</table>`;
  const text = `${c.heading}\n\n${c.intro}\n\n    ${token}\n\n${NOTE}\n\nDidn't ask for this? You can ignore this email. ${c.ignore}\n\nwhereabout · https://www.whereabout.world`;
  return { subject: c.subject, html, text };
}
