import React, { useState } from 'react';
import styles from './Contact.module.css';

const plantTips = [
  {
    icon: '💧',
    title: 'Watering',
    tip: 'Water deeply but infrequently. Most indoor plants prefer to dry out slightly between waterings. Check the top 2 inches of soil — if it\'s dry, it\'s time to water.',
    tag: 'Essential',
  },
  {
    icon: '☀️',
    title: 'Sunlight',
    tip: 'Place plants near bright, indirect light. South or east-facing windows are ideal. Avoid harsh afternoon sun, which can scorch delicate leaves.',
    tag: 'Lighting',
  },
  {
    icon: '🌱',
    title: 'Soil & Potting',
    tip: 'Use well-draining potting mix suited to your plant type. Succulents need sandy soil; tropicals prefer a peat-rich blend. Repot every 1–2 years as roots outgrow the pot.',
    tag: 'Growth',
  },
  {
    icon: '🌡️',
    title: 'Temperature',
    tip: 'Most houseplants thrive between 18–27°C. Avoid placing them near cold drafts, air conditioners, or heating vents to prevent stress and leaf drop.',
    tag: 'Climate',
  },
  {
    icon: '🍃',
    title: 'Fertilising',
    tip: 'Feed your plants with a balanced liquid fertiliser every 2–4 weeks during the growing season (spring and summer). Reduce or stop feeding in winter.',
    tag: 'Nutrition',
  },
  {
    icon: '🐛',
    title: 'Pest Control',
    tip: 'Inspect leaves regularly for mealybugs, spider mites, or scale insects. Wipe leaves with neem oil solution or insecticidal soap to keep pests at bay.',
    tag: 'Health',
  },
];

const Contact = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (i) => setActiveIndex(activeIndex === i ? null : i);

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

      {/* Main Layout */}
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

        {/* Right: Plant Care Quick Tips */}
        <div className={styles.tipsColumn}>
          <div className={styles.tipsHeader}>
            <span className={styles.tipsLabel}>🌿 Plant Care Quick Tips</span>
            <p className={styles.tipsSubtitle}>Essential care advice from our nursery specialists to keep your plants thriving.</p>
          </div>
          <div className={styles.tipsGrid}>
            {plantTips.map((item, i) => (
              <div
                key={i}
                className={`${styles.tipCard} ${activeIndex === i ? styles.tipCardActive : ''}`}
                onClick={() => toggle(i)}
              >
                <div className={styles.tipCardTop}>
                  <span className={styles.tipIcon}>{item.icon}</span>
                  <div className={styles.tipMeta}>
                    <span className={styles.tipTag}>{item.tag}</span>
                    <h4 className={styles.tipTitle}>{item.title}</h4>
                  </div>
                  <span className={styles.tipChevron}>{activeIndex === i ? '▲' : '▼'}</span>
                </div>
                {activeIndex === i && (
                  <p className={styles.tipText}>{item.tip}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
