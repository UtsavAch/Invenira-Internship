import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.wrapper}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.title}>Welcome to Inven!RA</h1>
        <p style={styles.subtitle}>
          Discover, Create, and Share Interactive Learning Experiences
        </p>
        <div style={styles.buttonGroup}>
          <Link to="/signup" style={styles.buttonPrimary}>
            Get Started
          </Link>
          <Link to="/store" style={styles.buttonOutline}>
            Explore Store
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <h2 style={styles.featuresTitle}>Why Choose Inven!RA?</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureBox}>
            <h4 style={styles.featureHeading}>📚 Diverse Activities</h4>
            <p>Explore a wide range of interactive learning experiences.</p>
          </div>
          <div style={styles.featureBox}>
            <h4 style={styles.featureHeading}>🛠️ Create & Share</h4>
            <p>Design your own activities and share them with others.</p>
          </div>
          <div style={styles.featureBox}>
            <h4 style={styles.featureHeading}>🎯 Engage Students</h4>
            <p>Boost engagement with tools that enhance learning.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={styles.cta}>
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of educators already using Inven!RA</p>
        <Link to="/signup" style={styles.buttonLight}>
          Create Account
        </Link>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 Inven!RA. All rights reserved.</p>
        <div style={styles.footerLinks}>
          <Link to="/about" style={styles.footerLink}>
            About
          </Link>
          <Link to="/contact" style={styles.footerLink}>
            Contact
          </Link>
          <Link to="/faq" style={styles.footerLink}>
            FAQ
          </Link>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily: "Arial, sans-serif",
    color: "#333",
    lineHeight: "1.6",
  },
  hero: {
    padding: "80px 20px",
    textAlign: "center",
  },
  title: {
    color: "#007bff",
    fontSize: "3rem",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginBottom: "30px",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  },
  buttonPrimary: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "6px",
    fontWeight: "bold",
    textDecoration: "none",
  },
  buttonOutline: {
    border: "2px solid #007bff",
    color: "#333",
    padding: "10px 22px",
    borderRadius: "6px",
    fontWeight: "bold",
    textDecoration: "none",
  },
  features: {
    padding: "60px 20px",
    backgroundColor: "#f9f9f9",
    textAlign: "center",
  },
  featuresTitle: {
    fontSize: "1.8rem",
    marginBottom: "40px",
  },
  featureGrid: {
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: "20px",
  },
  featureBox: {
    flex: "1 1 250px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  featureHeading: {
    fontSize: "1.2rem",
    marginBottom: "10px",
  },
  cta: {
    backgroundColor: "#333",
    color: "#fff",
    textAlign: "center",
    padding: "50px 20px",
  },
  buttonLight: {
    backgroundColor: "#fff",
    color: "#333",
    padding: "12px 24px",
    borderRadius: "6px",
    fontWeight: "bold",
    textDecoration: "none",
    marginTop: "20px",
    display: "inline-block",
  },
  footer: {
    backgroundColor: "#f1f1f1",
    textAlign: "center",
    padding: "20px 10px",
    marginTop: "30px",
  },
  footerLinks: {
    marginTop: "10px",
  },
  footerLink: {
    margin: "0 10px",
    color: "#555",
    textDecoration: "none",
  },
};
