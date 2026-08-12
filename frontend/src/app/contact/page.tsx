export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">
          We would love to host you. For private events, team dinners, or catering inquiries, reach out any day of the week.
        </p>
      </div>

      <div className="container-wide two-col-grid anim-rise-delay">
        <section className="panel">
          <div className="feature-icon">📍</div>
          <h2>Visit Us</h2>
          <p className="muted" style={{ marginBottom: "0.4rem" }}>221 Hearth Avenue, Downtown Space</p>
          <p className="muted">Open daily: 11:00 AM - 11:00 PM</p>
        </section>
        <section className="panel">
          <div className="feature-icon">✉️</div>
          <h2>Reach Out</h2>
          <p className="muted" style={{ marginBottom: "0.4rem" }}>Email: hello@busserzxcodehoppers.com</p>
          <p className="muted">Phone: +46 10 123 45 67</p>
        </section>
      </div>
    </div>
  );
}