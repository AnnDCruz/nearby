function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProfileTab({ user, onLogout }) {
  return (
    <div style={{ height: "100%", background: "var(--paper)", padding: "36px 24px 16px", overflowY: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "var(--forest)",
            color: "var(--white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {initials(user.name)}
        </div>
        <h2 className="display" style={{ fontSize: 18, margin: 0 }}>{user.name}</h2>
        <p style={{ fontSize: 13, color: "var(--stone)", margin: "2px 0 0" }}>{user.email}</p>
        <span className="badge" style={{ marginTop: 10 }}>{user.accountType === "organizer" ? "Organizer" : "Explorer"}</span>
      </div>

      <div className="divider-list">
        {["Notification settings", "Privacy & location sharing", "Invite friends", "Help & support"].map((row) => (
          <div key={row} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 4px" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--stone-soft)" }}>{row}</span>
            <span className="badge" style={{ color: "var(--stone-soft)", fontSize: 10 }}>Soon</span>
          </div>
        ))}
      </div>

      <button className="btn-outline" style={{ marginTop: 28, color: "var(--blaze-dark)", borderColor: "var(--blaze)" }} onClick={onLogout}>
        Log out
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--stone-soft)", marginTop: 12 }}>
        Your saved spots stay safe on the server — log back in anytime to get them back.
      </p>
    </div>
  );
}
