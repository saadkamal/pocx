export default function Home() {
  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      <p style={{ fontSize: "3rem", margin: 0 }}>🔒</p>
      <h1 style={{ margin: "0.5rem 0" }}>Secret PoC</h1>
      <p style={{ color: "#a1a1aa", maxWidth: "28rem" }}>
        If you can read this, POCX let you in: your email is on the
        allowlist, you passed the OTP check, and you e-signed the Terms of
        Access. Revoke the session from the POCX dashboard and this page
        disappears within a minute.
      </p>
    </main>
  );
}
