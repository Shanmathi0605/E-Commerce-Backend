import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <a href="#about" className={styles.linkItem}>About Us</a>
        <a href="#terms" className={styles.linkItem}>Terms of Service</a>
        <a href="#privacy" className={styles.linkItem}>Privacy Policy</a>
        <a href="#help" className={styles.linkItem}>Help Center</a>
      </div>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} GLASS Plant E-Commerce Storefront. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
