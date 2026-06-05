import React, { useState } from 'react';
import styles from './Contact.module.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }
    setLoading(true);

    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Get In Touch</span>
          <h1 className={styles.title}>We'd Love to Hear From You</h1>
          <p className={styles.subtitle}>
            Have questions about plant care, custom terrariums, or bulk orders? Reach out to our nursery specialists.
          </p>
        </div>
      </section>

      {/* Main Form and Details Layout */}
      <div className={styles.contentGrid}>
        {/* Left: Contact Info */}
        <div className={styles.infoColumn}>
          <div className={styles.card}>
            <h3>Nursery Information</h3>
            <p className={styles.description}>
              Visit our glass greenhouse experience center or contact us directly.
            </p>

            <div className={styles.infoItems}>
              <div className={styles.infoItem}>
                <span className={styles.icon}>📍</span>
                <div>
                  <h4>Nursery Location</h4>
                  <p>Glasshouse Gardens, Block C, OMR, Chennai, TN 600097</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.icon}>📞</span>
                <div>
                  <h4>Call / WhatsApp</h4>
                  <p>+91 98765 43210</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.icon}>✉️</span>
                <div>
                  <h4>Email Support</h4>
                  <p>support@glassplants.com</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.icon}>🕒</span>
                <div>
                  <h4>Nursery Hours</h4>
                  <p>Monday - Saturday: 9:00 AM - 7:00 PM<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Guide / Alert Box */}
          <div className={styles.guideCard}>
            <h4>💡 Need Immediate Care Tips?</h4>
            <p>
              Check out our <a href="/plant-hub">Care Hub</a> to get detailed instructions on watering schedules, light requirements, and plant repotting guides.
            </p>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className={styles.formColumn}>
          <div className={styles.card}>
            <h3>Send a Message</h3>
            
            {submitted ? (
              <div className={styles.successBlock}>
                <span className={styles.successIcon}>🌿</span>
                <h4>Thank You!</h4>
                <p>Your message has been successfully sent. A plant specialist will reach out to you within 24 hours.</p>
                <button 
                  className={styles.resetBtn} 
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Topic (e.g. bulk order, custom terrariums)"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    rows="5"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Sending message...' : 'Submit Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
