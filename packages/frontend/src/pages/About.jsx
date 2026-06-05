import React from 'react';
import styles from './About.module.css';

const About = () => {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Our Passion</span>
          <h1 className={styles.title}>Nurturing Nature in Modern Spaces</h1>
          <p className={styles.subtitle}>
            Discover the story behind GLASS Plant &amp; Nursery Store, where we merge botanical beauty with modern glass aesthetics.
          </p>
        </div>
      </section>

      {/* Main content grid */}
      <div className={styles.content}>
        {/* Story Section */}
        <section className={styles.gridSection}>
          <div className={styles.textBlock}>
            <span className={styles.sectionBadge}>Our Beginnings</span>
            <h2 className={styles.sectionTitle}>The Story of GLASS</h2>
            <p className={styles.paragraph}>
              Founded in 2024, GLASS started as a small, passionate group of botanists, architects, and interior designers who shared a common vision: to bring green back into urban ecosystems. We believe that living spaces should breathe, grow, and adapt with nature.
            </p>
            <p className={styles.paragraph}>
              The name **GLASS** represents our signature aesthetic. We showcase nature's creations in transparent, premium glass terrariums and minimalist vessels, allowing the intricate details of roots, soil layers, and foliage to be appreciated as living art.
            </p>
          </div>
          <div className={styles.imageBlock}>
            <img 
              src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=600" 
              alt="Green nursery showcase" 
              className={styles.featuredImage}
            />
          </div>
        </section>

        {/* Mission and values */}
        <section className={styles.valuesSection}>
          <div className={styles.centeredHeader}>
            <span className={styles.sectionBadge}>How We Work</span>
            <h2 className={styles.sectionTitle}>Our Core Values</h2>
            <p className={styles.centeredSubtitle}>
              Every botanical specimen we prepare, package, and ship is treated with utmost care and respect for nature.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.iconWrapper}>🌿</div>
              <h3>Premium Specimen Quality</h3>
              <p>We source only the healthiest plants, grown in premium organic soil, ensuring robust root systems ready to adapt to your home.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.iconWrapper}>🌎</div>
              <h3>Sustainable Growth</h3>
              <p>From eco-friendly coconut coir soil blocks to recyclable packaging materials, we strive to leave a minimal footprint on our planet.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.iconWrapper}>💚</div>
              <h3>Continuous Care Support</h3>
              <p>We do not just sell plants; we guide you. Access detailed plant care guidelines, troubleshooting tips, and chatbot support 24/7.</p>
            </div>
          </div>
        </section>

        {/* Team or stats summary */}
        <section className={styles.statsSection}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>15,000+</span>
            <span className={styles.statLabel}>Plants Delivered</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>4.9 ★</span>
            <span className={styles.statLabel}>Customer Rating</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>15+</span>
            <span className={styles.statLabel}>Specialty Microservices</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
