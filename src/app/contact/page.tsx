export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Contact</h1>
        <p className="page-subtitle">
          We would love to host you. For private events, team dinners, or
          catering inquiries, reach out any day of the week.
        </p>
      </div>

      <div className="container-wide two-col-grid anim-rise-delay">
        <section className="panel">
          <h2>Visit Us</h2>
          <p className="muted">221 Hearth Avenue, Downtown</p>
          <p className="muted">Open daily: 11:00 AM - 11:00 PM</p>
        </section>
        <section className="panel">
          <h2>Reach Out</h2>
          <p className="muted">Email: hello@busserzxcodehoppers.com</p>
          <p className="muted">Phone: +46 10 123 45 67</p>
        </section>
      </div>
    </div>
  );
}