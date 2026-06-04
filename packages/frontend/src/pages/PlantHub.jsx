import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './PlantHub.module.css';
import {
  FiDroplet,
  FiActivity,
  FiPlus,
  FiTrash2,
  FiCompass,
  FiLayers,
  FiMessageSquare,
  FiAward,
  FiPackage,
  FiCheckCircle,
  FiRefreshCw
} from 'react-icons/fi';

// Fallback plants catalog in case API call is slow/empty
const FALLBACK_PRODUCTS = [
  { id: 'plant-monstera', title: 'Monstera Deliciosa', price: 499, images: ['https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=300&auto=format&fit=crop'], category: 'indoor-plants' },
  { id: 'plant-snake', title: 'Snake Plant (Sansevieria)', price: 299, images: ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=300&auto=format&fit=crop'], category: 'indoor-plants' },
  { id: 'plant-pothos', title: 'Golden Pothos', price: 199, images: ['https://images.unsplash.com/photo-1597055181300-e3633a207518?q=80&w=300&auto=format&fit=crop'], category: 'indoor-plants' },
  { id: 'plant-bonsai', title: 'Bonsai Juniper Tree', price: 799, images: ['https://images.unsplash.com/photo-1613143763784-9dfc1fb22467?q=80&w=300&auto=format&fit=crop'], category: 'succulents' },
  { id: 'plant-cactus', title: 'Desert Rose Cactus', price: 249, images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop'], category: 'succulents' },
  { id: 'tool-neem', title: 'Organic Neem Oil Care Spray', price: 149, images: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=300&auto=format&fit=crop'], category: 'tools' },
  { id: 'tool-soil', title: 'Premium Well-Draining Potting Soil', price: 120, images: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=300&auto=format&fit=crop'], category: 'tools' },
  { id: 'tool-fertilizer', title: 'Slow-Release Seaweed Organic Fertilizer', price: 90, images: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=300&auto=format&fit=crop'], category: 'tools' }
];

const PlantHub = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('sill'); // 'sill', 'doctor', 'impact', 'sub', 'designer'

  // Products from API
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);

  // My Garden Sill State
  const [myPlants, setMyPlants] = useState(() => {
    const saved = localStorage.getItem('hub_garden_plants');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Spike', type: 'Desert Rose Cactus', moisture: 80, frequency: 7, lastWatered: Date.now(), image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop' },
      { id: 2, name: 'Monty', type: 'Monstera Deliciosa', moisture: 45, frequency: 3, lastWatered: Date.now(), image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=300&auto=format&fit=crop' }
    ];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantType, setNewPlantType] = useState('Monstera Deliciosa');
  const [wateringCount, setWateringCount] = useState(() => Number(localStorage.getItem('hub_watering_count') || '5'));

  // AI Doctor State
  const [chatHistory, setChatHistory] = useState([
    { sender: 'doctor', text: "Hello! I am Doc Green, your AI Plant Care Assistant. Select one of the common symptoms on the left or type your query below to diagnose your plant's issues!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Subscription Builder State
  const [subStep, setSubStep] = useState(1);
  const [subTheme, setSubTheme] = useState('Air Purifiers');
  const [subSize, setSubSize] = useState('Twin Greens');
  const [subPot, setSubPot] = useState('Terracotta');
  const [subInterval, setSubInterval] = useState('Monthly');
  const [subscriptionActive, setSubscriptionActive] = useState(() => !!localStorage.getItem('hub_subscription'));

  // Room Designer State
  const [placedPlants, setPlacedPlants] = useState([]);
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [scaleFactor, setScaleFactor] = useState(100);
  const canvasRef = useRef(null);

  // Fetch real products on mount to populate designer and recommendations
  useEffect(() => {
    const fetchStoreProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        if (res.data && res.data.length > 0) {
          // Merge API products with fallbacks, prioritizing unique names
          const merged = [...res.data, ...FALLBACK_PRODUCTS];
          const unique = [];
          const seen = new Set();
          for (const item of merged) {
            const title = item.title?.toLowerCase();
            if (!seen.has(title)) {
              seen.add(title);
              unique.push(item);
            }
          }
          setProducts(unique);
        }
      } catch (err) {
        console.log('Using default plant database catalog...');
      }
    };
    fetchStoreProducts();
  }, []);

  // Save Garden Sill and Stats to Local Storage
  useEffect(() => {
    localStorage.setItem('hub_garden_plants', JSON.stringify(myPlants));
  }, [myPlants]);

  useEffect(() => {
    localStorage.setItem('hub_watering_count', wateringCount.toString());
  }, [wateringCount]);

  // Simulate slow moisture drain over time (ticks every 10 seconds for visual display)
  useEffect(() => {
    const interval = setInterval(() => {
      setMyPlants((prev) =>
        prev.map((plant) => {
          const drainRate = 100 / (plant.frequency * 24 * 360); // small drain percentage
          const nextMoisture = Math.max(0, Math.round(plant.moisture - drainRate * 100));
          return { ...plant, moisture: nextMoisture };
        })
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat history
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Points & Badges Calculations
  const calculatedPoints = myPlants.length * 50 + wateringCount * 10;
  
  const getBadgeDetails = () => {
    if (calculatedPoints >= 500) return { name: 'Forest Guardian', coupon: 'FOREST20', discount: '20%', nextReq: 0 };
    if (calculatedPoints >= 250) return { name: 'Green Master', coupon: 'MASTER15', discount: '15%', nextReq: 500 };
    if (calculatedPoints >= 100) return { name: 'Sapling Expert', coupon: 'SAPLING12', discount: '12%', nextReq: 250 };
    return { name: 'Sprout Cared', coupon: 'SPROUT10', discount: '10%', nextReq: 100 };
  };

  const badgeInfo = getBadgeDetails();

  // Water Plant Handler
  const handleWaterPlant = (id) => {
    setMyPlants((prev) =>
      prev.map((plant) => {
        if (plant.id === id) {
          return { ...plant, moisture: 100, lastWatered: Date.now() };
        }
        return plant;
      })
    );
    setWateringCount((prev) => prev + 1);
  };

  // Add Plant to Sill Handler
  const handleAddPlantToSill = (e) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;

    const matchingCatalog = products.find(p => p.title.toLowerCase().includes(newPlantType.toLowerCase())) || FALLBACK_PRODUCTS[0];
    const newPlant = {
      id: Date.now(),
      name: newPlantName,
      type: newPlantType,
      moisture: 100,
      frequency: newPlantType.includes('Cactus') || newPlantType.includes('Succulent') ? 7 : 3,
      lastWatered: Date.now(),
      image: matchingCatalog.images?.[0] || 'https://via.placeholder.com/300'
    };

    setMyPlants((prev) => [...prev, newPlant]);
    setNewPlantName('');
    setShowAddModal(false);
  };

  // Delete Plant from Sill
  const handleDeletePlant = (id) => {
    setMyPlants((prev) => prev.filter(p => p.id !== id));
  };

  // Diagnostic Prescriptions for AI Doctor
  const DIAGNOSIS_DB = {
    'yellowing': {
      diagnosis: 'Overwatering (Root Rot Risk)',
      prescription: 'The roots are likely suffocated due to wet soil. Let the top 2 inches of soil dry completely before watering again. Ensure your pot has drainage holes.',
      recs: ['Premium Well-Draining Potting Soil', 'Organic Neem Oil Care Spray']
    },
    'brown-tips': {
      diagnosis: 'Low Humidity or Underwatering',
      prescription: 'Crispy brown leaf tips indicate dry air or inconsistent watering. Mist your plant regularly or place a tray of water next to it. Water immediately.',
      recs: ['Desert Rose Cactus', 'Bonsai Juniper Tree']
    },
    'white-spots': {
      diagnosis: 'Spider Mites / Fungal Infestation',
      prescription: 'Fine white spots or webbing is caused by pest insects. Spray all leaf surfaces with a soap-and-neem-oil mixture immediately. Move the infected plant away from others.',
      recs: ['Organic Neem Oil Care Spray', 'Slow-Release Seaweed Organic Fertilizer']
    },
    'drooping': {
      diagnosis: 'Lack of Light or Underwatering',
      prescription: 'Stems are drooping due to loss of cell water pressure. Give it a thorough soak and shift it to a spot receiving medium to high indirect sunlight.',
      recs: ['Bonsai Juniper Tree', 'Premium Well-Draining Potting Soil']
    }
  };

  // Symptom Click Diagnostic Trigger
  const handleSymptomSelect = (key, label) => {
    const data = DIAGNOSIS_DB[key];
    if (!data) return;

    const recommendedItems = products.filter(p =>
      data.recs.some(name => p.title.toLowerCase().includes(name.toLowerCase()))
    );

    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: `My plant has ${label}.` },
      {
        sender: 'doctor',
        text: `Based on the symptoms of "${label}", my diagnosis is:`,
        diagnosis: data.diagnosis,
        prescription: data.prescription,
        products: recommendedItems.length > 0 ? recommendedItems : products.slice(5, 8)
      }
    ]);
  };

  // Chat Custom Send Input
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const inputLower = chatInput.toLowerCase();
    let replyKey = 'yellowing'; // default fallback
    let matchLabel = 'general leaf stress';

    if (inputLower.includes('brown') || inputLower.includes('dry') || inputLower.includes('crispy')) {
      replyKey = 'brown-tips';
      matchLabel = 'Dry / Brown Leaf Tips';
    } else if (inputLower.includes('spot') || inputLower.includes('bug') || inputLower.includes('white') || inputLower.includes('pest')) {
      replyKey = 'white-spots';
      matchLabel = 'Pest or White Spots';
    } else if (inputLower.includes('droop') || inputLower.includes('wilt') || inputLower.includes('hang')) {
      replyKey = 'drooping';
      matchLabel = 'Drooping stems';
    } else if (inputLower.includes('yellow') || inputLower.includes('water')) {
      replyKey = 'yellowing';
      matchLabel = 'Yellow leaves';
    }

    const data = DIAGNOSIS_DB[replyKey];
    const recommendedItems = products.filter(p =>
      data.recs.some(name => p.title.toLowerCase().includes(name.toLowerCase()))
    );

    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: chatInput },
      {
        sender: 'doctor',
        text: `I've analyzed your description "${chatInput}". Here's my diagnostic advice:`,
        diagnosis: data.diagnosis,
        prescription: data.prescription,
        products: recommendedItems.length > 0 ? recommendedItems : products.slice(5, 8)
      }
    ]);

    setChatInput('');
  };

  // Add Recommended Product to Cart
  const handleAddProductToCart = async (product) => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/cart', {
        productId: product.id || product._id,
        variantId: '',
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1
      }, config);
      alert(`${product.title} has been added to your cart!`);
    } catch (err) {
      alert('Failed to add product to cart.');
    }
  };

  // Subscription Checkout Finalize
  const handleFinalizeSubscription = () => {
    const subData = {
      theme: subTheme,
      size: subSize,
      pot: subPot,
      interval: subInterval,
      cost: subSize === 'Single Sprout' ? 299 : subSize === 'Twin Greens' ? 499 : 899,
      date: new Date().toLocaleDateString()
    };
    localStorage.setItem('hub_subscription', JSON.stringify(subData));
    setSubscriptionActive(true);
    setSubStep(4); // Show success step
  };

  // Clear active subscription
  const handleCancelSubscription = () => {
    localStorage.removeItem('hub_subscription');
    setSubscriptionActive(false);
    setSubStep(1);
  };

  // Room Designer: Add plant to canvas
  const handleAddPlantToCanvas = (item) => {
    const newPlaced = {
      canvasId: Date.now(),
      id: item.id || item._id,
      title: item.title,
      price: item.price,
      image: item.images?.[0],
      x: 100 + placedPlants.length * 30,
      y: 120,
      scale: 1.0
    };
    setPlacedPlants((prev) => [...prev, newPlaced]);
    setActiveCanvasId(newPlaced.canvasId);
    setScaleFactor(100);
  };

  // Handle Drag events on canvas
  const handleCanvasMouseDown = (e, canvasId) => {
    setActiveCanvasId(canvasId);
    const plant = placedPlants.find(p => p.canvasId === canvasId);
    if (!plant) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = plant.x;
    const initialY = plant.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // Restrict values inside workspace box dimensions (approx 800x420)
      const newX = Math.max(0, Math.min(720, initialX + dx));
      const newY = Math.max(0, Math.min(320, initialY + dy));

      setPlacedPlants((prev) =>
        prev.map((p) => (p.canvasId === canvasId ? { ...p, x: newX, y: newY } : p))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Adjust active plant scale
  const handleScaleChange = (e) => {
    const factor = Number(e.target.value);
    setScaleFactor(factor);
    setPlacedPlants((prev) =>
      prev.map((p) => (p.canvasId === activeCanvasId ? { ...p, scale: factor / 100 } : p))
    );
  };

  // Delete plant from canvas
  const handleDeleteFromCanvas = (canvasId) => {
    setPlacedPlants((prev) => prev.filter(p => p.canvasId !== canvasId));
    if (activeCanvasId === canvasId) {
      setActiveCanvasId(null);
    }
  };

  // Buy entire custom layout in one click
  const handleBuyCanvasSetup = async () => {
    if (!isAuthenticated) {
      alert('Please log in to purchase this plant setup.');
      navigate('/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Sequentially add each placed item to backend cart
      for (const item of placedPlants) {
        await axios.post('/api/cart', {
          productId: item.id,
          variantId: '',
          title: item.title,
          price: item.price,
          image: item.image,
          quantity: 1
        }, config);
      }

      alert('All plants on your canvas have been added to your shopping cart!');
      navigate('/cart');
    } catch (err) {
      alert('Failed to add canvas setup to cart.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>GLASS Care &amp; Design Hub</h1>
        <p className={styles.subtitle}>Manage your garden, seek advice from Doc Green, track your green footprint, and visualize custom arrangements.</p>
      </div>

      {/* Tabs Row */}
      <div className={styles.tabsHeader}>
        <button className={`${styles.tabBtn} ${activeTab === 'sill' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('sill')}>
          <FiCompass /> Garden Sill
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'doctor' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('doctor')}>
          <FiMessageSquare /> AI Plant Doctor
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'impact' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('impact')}>
          <FiAward /> Green Impact
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'sub' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('sub')}>
          <FiPackage /> Green Box
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'designer' ? styles.activeTabBtn : ''}`} onClick={() => setActiveTab('designer')}>
          <FiLayers /> Sill Designer
        </button>
      </div>

      {/* Primary Card */}
      <div className={styles.contentCard}>

        {/* Tab 1: Garden Sill */}
        {activeTab === 'sill' && (
          <div>
            <div className={styles.sillHeader}>
              <div className={styles.sillTitle}>🪴 My Active Garden Sill</div>
              <button className={styles.btnAddPlant} onClick={() => setShowAddModal(true)}>+ Add Plant</button>
            </div>

            <div className={styles.sillShelves}>
              <div className={styles.shelfContainer}>
                <div className={styles.shelfGrid}>
                  {myPlants.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                      Sill is empty. Click "+ Add Plant" to place a plant on your windowsill!
                    </div>
                  ) : (
                    myPlants.map((plant) => (
                      <div key={plant.id} className={styles.plantCard}>
                        <button className={styles.btnDeletePlant} title="Remove Plant" onClick={() => handleDeletePlant(plant.id)}>
                          <FiTrash2 size={12} />
                        </button>
                        <img src={plant.image} alt={plant.name} className={styles.plantCardImage} />
                        <div className={styles.plantCardName}>{plant.name}</div>
                        <div className={styles.plantCardType}>{plant.type}</div>

                        <div className={styles.moistureGauge}>
                          <div
                            className={styles.moistureFill}
                            style={{
                              width: `${plant.moisture}%`,
                              backgroundColor: plant.moisture > 60 ? '#10b981' : plant.moisture > 30 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>

                        <div className={styles.moistureTextRow}>
                          <span>Moisture</span>
                          <span>{plant.moisture}%</span>
                        </div>

                        <button className={styles.btnWater} onClick={() => handleWaterPlant(plant.id)}>
                          <FiDroplet /> Water
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.shelfWood}></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Plant Doctor */}
        {activeTab === 'doctor' && (
          <div className={styles.doctorWrapper}>
            <div className={styles.doctorSidebar}>
              <div className={styles.doctorHolo}>
                <div className={styles.doctorAvatar}>🩺</div>
                <div className={styles.doctorName}>Doc Green</div>
                <div className={styles.doctorRole}>Holographic Care Agent</div>
              </div>

              <div className={styles.symptomList}>
                <div className={styles.symptomTitle}>Quick Symptoms</div>
                <button className={styles.btnSymptom} onClick={() => handleSymptomSelect('yellowing', 'yellowing leaves')}>
                  🍂 Yellow leaves
                </button>
                <button className={styles.btnSymptom} onClick={() => handleSymptomSelect('brown-tips', 'brown leaf tips')}>
                  🍁 Dry / Brown leaf tips
                </button>
                <button className={styles.btnSymptom} onClick={() => handleSymptomSelect('white-spots', 'white spots or webs')}>
                  🕸️ White spots / spider webs
                </button>
                <button className={styles.btnSymptom} onClick={() => handleSymptomSelect('drooping', 'drooping stems')}>
                  🥀 Drooping / Wilting stems
                </button>
              </div>
            </div>

            <div className={styles.chatArea}>
              <div className={styles.chatHistory}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`${styles.chatBubble} ${msg.sender === 'user' ? styles.bubbleUser : styles.bubbleDoctor}`}>
                    <p style={{ margin: 0 }}>{msg.text}</p>
                    
                    {msg.diagnosis && (
                      <div className={styles.doctorPrescription}>
                        <div className={styles.prescriptionTitle}>🚨 DIAGNOSIS:</div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{msg.diagnosis}</div>
                        <div className={styles.prescriptionTitle}>💊 TREATMENT PLAN:</div>
                        <div style={{ fontSize: '0.8rem' }}>{msg.prescription}</div>
                      </div>
                    )}

                    {msg.products && (
                      <div>
                        <div className={styles.recommendedHeader}>RECOMMENDED PRODUCTS:</div>
                        <div className={styles.recGrid}>
                          {msg.products.map((p, pIdx) => (
                            <div key={pIdx} className={styles.recCard}>
                              <img src={p.images?.[0] || 'https://via.placeholder.com/150'} alt={p.title} className={styles.recImg} />
                              <div className={styles.recTitle}>{p.title}</div>
                              <div className={styles.recBottom}>
                                <span className={styles.recPrice}>₹{p.price}</span>
                                <button className={styles.btnAddToCartIcon} onClick={() => handleAddProductToCart(p)}>
                                  Add +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef}></div>
              </div>

              <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
                <input
                  type="text"
                  placeholder="Ask Doc Green about yellowing leaves, watering, soils..."
                  className={styles.chatInput}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className={styles.btnSend}>Diagnose</button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Green Impact */}
        {activeTab === 'impact' && (
          <div className={styles.impactDashboard}>
            <div className={styles.impactStatsCol}>
              <div className={styles.sillTitle} style={{ marginBottom: '1rem' }}>📈 Carbon Absorption Footprint</div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🌿</div>
                <div>
                  <div className={styles.statLabel}>Plants Cared For</div>
                  <div className={styles.statVal}>{myPlants.length} Plants</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>💧</div>
                <div>
                  <div className={styles.statLabel}>Watering Cycles Logged</div>
                  <div className={styles.statVal}>{wateringCount} times</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🌍</div>
                <div>
                  <div className={styles.statLabel}>CO₂ Absorbed Annually</div>
                  <div className={styles.statVal} style={{ color: '#10b981' }}>
                    {(myPlants.length * 1.2 + wateringCount * 0.1).toFixed(2)} kg
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.badgeTrackerCard}>
                <div className={styles.badgeTitleRow}>
                  <span>Current Tier Rank:</span>
                  <span className={styles.badgeName}>{badgeInfo.name}</span>
                </div>
                <div className={styles.badgeTitleRow}>
                  <span>Total Green Points:</span>
                  <span className={styles.badgePoints}>{calculatedPoints} XP</span>
                </div>

                <div className={styles.badgeProgressOuter}>
                  <div
                    className={styles.badgeProgressInner}
                    style={{
                      width: `${Math.min(100, badgeInfo.nextReq > 0 ? (calculatedPoints / badgeInfo.nextReq) * 100 : 100)}%`
                    }}
                  ></div>
                </div>

                <div className={styles.badgeProgressSubtext}>
                  {badgeInfo.nextReq > 0 ? (
                    <span>Water plants or add new plants to sill to unlock next rank at {badgeInfo.nextReq} XP!</span>
                  ) : (
                    <span>Wow! You've achieved the highest ranking rank of Forest Guardian! 🌟</span>
                  )}
                </div>

                {/* Badge Claims */}
                <div className={styles.couponOverlay}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.2rem' }}>
                    🎉 UNLOCKED DISPATCH COUPON:
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Apply this {badgeInfo.discount} discount code at checkout:
                  </span>
                  <div className={styles.couponCode}>{badgeInfo.coupon}</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <div className={styles.symptomTitle} style={{ marginBottom: '0.8rem' }}>Tier Badges Showcase</div>
                <div className={styles.badgeGrid}>
                  <div className={`${styles.badgeCard} ${calculatedPoints >= 0 ? '' : styles.badgeCardLocked}`}>
                    <span className={styles.badgeIcon}>🌱</span>
                    <span className={styles.badgeCardName}>Sprout Cared</span>
                    <span className={styles.badgeCardLevel}>Level 1</span>
                    <span className={styles.badgeCardReq}>0 XP Required</span>
                  </div>

                  <div className={`${styles.badgeCard} ${calculatedPoints >= 100 ? '' : styles.badgeCardLocked}`}>
                    <span className={styles.badgeIcon}>🌿</span>
                    <span className={styles.badgeCardName}>Sapling Expert</span>
                    <span className={styles.badgeCardLevel}>Level 2</span>
                    <span className={styles.badgeCardReq}>100 XP Required</span>
                  </div>

                  <div className={`${styles.badgeCard} ${calculatedPoints >= 250 ? '' : styles.badgeCardLocked}`}>
                    <span className={styles.badgeIcon}>🌳</span>
                    <span className={styles.badgeCardName}>Green Master</span>
                    <span className={styles.badgeCardLevel}>Level 3</span>
                    <span className={styles.badgeCardReq}>250 XP Required</span>
                  </div>

                  <div className={`${styles.badgeCard} ${calculatedPoints >= 500 ? '' : styles.badgeCardLocked}`}>
                    <span className={styles.badgeIcon}>👑</span>
                    <span className={styles.badgeCardName}>Forest Guardian</span>
                    <span className={styles.badgeCardLevel}>Level 4</span>
                    <span className={styles.badgeCardReq}>500 XP Required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Subscription Builder */}
        {activeTab === 'sub' && (
          <div className={styles.subContainer}>
            {subscriptionActive ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <FiCheckCircle size={48} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.8rem' }}>Your Green Box Subscription is Active!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                  Your personalized box is scheduled for packaging. A curation of rare indoor assets is on the way.
                </p>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', maxWidth: '440px', margin: '0 auto 2rem auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Theme Plan:</span>
                    <strong>{JSON.parse(localStorage.getItem('hub_subscription'))?.theme}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Box Size:</span>
                    <strong>{JSON.parse(localStorage.getItem('hub_subscription'))?.size}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Selected Pot Color:</span>
                    <strong>{JSON.parse(localStorage.getItem('hub_subscription'))?.pot}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Interval Cycle:</span>
                    <strong>{JSON.parse(localStorage.getItem('hub_subscription'))?.interval}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cost Rate:</span>
                    <strong style={{ color: '#10b981' }}>₹{JSON.parse(localStorage.getItem('hub_subscription'))?.cost} / cycle</strong>
                  </div>
                </div>

                <button className={styles.btnSubPrev} style={{ background: '#ef4444' }} onClick={handleCancelSubscription}>
                  Cancel Subscription Plan
                </button>
              </div>
            ) : (
              <div>
                <div className={styles.subSteps}>
                  <div className={styles.subStepsLine}></div>
                  <div className={`${styles.subStepNode} ${subStep >= 1 ? styles.subStepNodeActive : ''} ${subStep > 1 ? styles.subStepNodeDone : ''}`}>1</div>
                  <div className={`${styles.subStepNode} ${subStep >= 2 ? styles.subStepNodeActive : ''} ${subStep > 2 ? styles.subStepNodeDone : ''}`}>2</div>
                  <div className={`${styles.subStepNode} ${subStep >= 3 ? styles.subStepNodeActive : ''} ${subStep > 3 ? styles.subStepNodeDone : ''}`}>3</div>
                </div>

                {subStep === 1 && (
                  <div className={styles.subStepCard}>
                    <div className={styles.subStepTitle}>Choose Box Theme</div>
                    <div className={styles.subStepDesc}>Select the collection style for your plant deliveries.</div>

                    <div className={styles.optionsGrid}>
                      <div className={`${styles.optionCard} ${subTheme === 'Air Purifiers' ? styles.optionCardActive : ''}`} onClick={() => setSubTheme('Air Purifiers')}>
                        <div className={styles.optionLabel}>🌿 Air Purifiers</div>
                        <div className={styles.optionSublabel}>High-oxygen generating plants like Snake Plants, Pothos, Spider plants.</div>
                      </div>

                      <div className={`${styles.optionCard} ${subTheme === 'Hardy Succulents' ? styles.optionCardActive : ''}`} onClick={() => setSubTheme('Hardy Succulents')}>
                        <div className={styles.optionLabel}>🌵 Hardy Succulents</div>
                        <div className={styles.optionSublabel}>Drought-tolerant cute plants like Jade, Aloe, Cactus variants.</div>
                      </div>

                      <div className={`${styles.optionCard} ${subTheme === 'Rare Collectors' ? styles.optionCardActive : ''}`} onClick={() => setSubTheme('Rare Collectors')}>
                        <div className={styles.optionLabel}>💎 Rare Collectors</div>
                        <div className={styles.optionSublabel}>Harder to find specialty exotic varieties (Alocasias, Calatheas).</div>
                      </div>
                    </div>
                  </div>
                )}

                {subStep === 2 && (
                  <div className={styles.subStepCard}>
                    <div className={styles.subStepTitle}>Select Box Size</div>
                    <div className={styles.subStepDesc}>Choose how many plants you want delivered each time.</div>

                    <div className={styles.optionsGrid}>
                      <div className={`${styles.optionCard} ${subSize === 'Single Sprout' ? styles.optionCardActive : ''}`} onClick={() => setSubSize('Single Sprout')}>
                        <div className={styles.optionLabel}>🌱 Single Sprout</div>
                        <div className={styles.optionSublabel}>1 Plant + Designer Pot per cycle. Ideal for starters. (₹299/mo)</div>
                      </div>

                      <div className={`${styles.optionCard} ${subSize === 'Twin Greens' ? styles.optionCardActive : ''}`} onClick={() => setSubSize('Twin Greens')}>
                        <div className={styles.optionLabel}>🌿 Twin Greens</div>
                        <div className={styles.optionSublabel}>2 Plants + Ceramic Pots. Most popular choice. (₹499/mo)</div>
                      </div>

                      <div className={`${styles.optionCard} ${subSize === 'Jungle Pack' ? styles.optionCardActive : ''}`} onClick={() => setSubSize('Jungle Pack')}>
                        <div className={styles.optionLabel}>🌳 Jungle Pack</div>
                        <div className={styles.optionSublabel}>4 Plants + Designer accessories. Instant green corner. (₹899/mo)</div>
                      </div>
                    </div>
                  </div>
                )}

                {subStep === 3 && (
                  <div className={styles.subStepCard}>
                    <div className={styles.subStepTitle}>Choose Pot Color &amp; Interval</div>
                    <div className={styles.subStepDesc}>Customize your clay/pot color theme and delivery intervals.</div>

                    <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                      <span className={styles.formLabel}>Pot Color Theme</span>
                      <div className={styles.colorDotsGrid}>
                        <div className={styles.colorDotContainer} onClick={() => setSubPot('Terracotta')}>
                          <div className={`${styles.colorDot} ${subPot === 'Terracotta' ? styles.colorDotActive : ''}`} style={{ backgroundColor: '#c2410c' }}></div>
                          <span style={{ fontSize: '0.7rem' }}>Terracotta</span>
                        </div>
                        <div className={styles.colorDotContainer} onClick={() => setSubPot('Ceramic White')}>
                          <div className={`${styles.colorDot} ${subPot === 'Ceramic White' ? styles.colorDotActive : ''}`} style={{ backgroundColor: '#f8fafc' }}></div>
                          <span style={{ fontSize: '0.7rem' }}>White</span>
                        </div>
                        <div className={styles.colorDotContainer} onClick={() => setSubPot('Sage Green')}>
                          <div className={`${styles.colorDot} ${subPot === 'Sage Green' ? styles.colorDotActive : ''}`} style={{ backgroundColor: '#10b981' }}></div>
                          <span style={{ fontSize: '0.7rem' }}>Sage</span>
                        </div>
                        <div className={styles.colorDotContainer} onClick={() => setSubPot('Charcoal Grey')}>
                          <div className={`${styles.colorDot} ${subPot === 'Charcoal Grey' ? styles.colorDotActive : ''}`} style={{ backgroundColor: '#334155' }}></div>
                          <span style={{ fontSize: '0.7rem' }}>Charcoal</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Frequency Interval</span>
                      <select className={styles.formSelect} value={subInterval} onChange={(e) => setSubInterval(e.target.value)}>
                        <option value="Monthly">Monthly Plan (Every 4 weeks)</option>
                        <option value="Bi-weekly">Bi-weekly Plan (Every 2 weeks)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className={styles.subFooter}>
                  {subStep > 1 ? (
                    <button className={styles.btnSubPrev} onClick={() => setSubStep(subStep - 1)}>Back</button>
                  ) : (
                    <div></div>
                  )}

                  {subStep < 3 ? (
                    <button className={styles.btnSubNext} onClick={() => setSubStep(subStep + 1)}>Continue</button>
                  ) : (
                    <button className={styles.btnSubNext} onClick={handleFinalizeSubscription}>Activate Subscription</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Sill Designer */}
        {activeTab === 'designer' && (
          <div className={styles.designerLayout}>
            <div className={styles.designerSidebar}>
              <div className={styles.sidebarTitle}>Select Plants to Arrange</div>
              <div className={styles.designerPlantsGrid}>
                {products.filter(p => p.category !== 'tools').map((p) => (
                  <div key={p.id || p._id} className={styles.designerPlantItem} onClick={() => handleAddPlantToCanvas(p)}>
                    <img src={p.images?.[0] || 'https://via.placeholder.com/150'} alt={p.title} className={styles.designerPlantImg} />
                    <div className={styles.designerPlantName}>{p.title.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.canvasWrapper}>
              <div className={styles.canvasHeader}>
                <div className={styles.sillTitle}>🏠 Interactive Room Canvas</div>
                <div className={styles.canvasTools}>
                  <div className={styles.toolSliderGroup}>
                    <span>Scale Active:</span>
                    <input
                      type="range"
                      min="40"
                      max="180"
                      className={styles.slider}
                      value={scaleFactor}
                      onChange={handleScaleChange}
                      disabled={!activeCanvasId}
                    />
                    <span>{scaleFactor}%</span>
                  </div>
                  <button
                    className={styles.btnAddPlant}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    onClick={() => { setPlacedPlants([]); setActiveCanvasId(null); }}
                    disabled={placedPlants.length === 0}
                  >
                    Clear Sill
                  </button>
                </div>
              </div>

              <div
                ref={canvasRef}
                className={styles.designerCanvas}
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop')` }}
              >
                {placedPlants.length === 0 && (
                  <div className={styles.canvasPlaceholder}>
                    💡 Click a plant from the left sidebar to place it in the room! Drag plants to position them.
                  </div>
                )}

                {placedPlants.map((plant) => (
                  <div
                    key={plant.canvasId}
                    className={styles.placedPlant}
                    style={{
                      left: `${plant.x}px`,
                      top: `${plant.y}px`,
                      border: activeCanvasId === plant.canvasId ? '1px dashed #10b981' : 'none',
                      zIndex: activeCanvasId === plant.canvasId ? 10 : 2
                    }}
                    onMouseDown={(e) => handleCanvasMouseDown(e, plant.canvasId)}
                  >
                    <img
                      src={plant.image}
                      alt={plant.title}
                      className={styles.placedPlantImg}
                      style={{
                        width: `${100 * plant.scale}px`,
                        height: `${100 * plant.scale}px`
                      }}
                    />
                    <div className={styles.placedPlantControls}>
                      <button className={styles.placedControlBtn} title="Delete" onClick={() => handleDeleteFromCanvas(plant.canvasId)}>
                        <FiTrash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className={styles.btnBuySetup} disabled={placedPlants.length === 0} onClick={handleBuyCanvasSetup}>
                🛒 Buy Entire Canvas Setup (₹{placedPlants.reduce((sum, p) => sum + p.price, 0)})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Plant Modal Dialog */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>🪴 Place New Plant on Windowsill</div>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddPlantToSill}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Give your plant a nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Leafy, Sprout, Greeny"
                  required
                  className={styles.formInput}
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Plant Variety</label>
                <select className={styles.formSelect} value={newPlantType} onChange={(e) => setNewPlantType(e.target.value)}>
                  <option value="Monstera Deliciosa">Monstera Deliciosa</option>
                  <option value="Snake Plant (Sansevieria)">Snake Plant (Sansevieria)</option>
                  <option value="Golden Pothos">Golden Pothos</option>
                  <option value="Bonsai Juniper Tree">Bonsai Juniper Tree</option>
                  <option value="Desert Rose Cactus">Desert Rose Cactus</option>
                </select>
              </div>

              <button type="submit" className={styles.formSubmitBtn}>Place Plant</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantHub;
