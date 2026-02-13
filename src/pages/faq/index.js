import { useState, useEffect } from 'react';
import styles from './FAQ.module.scss';
import { BUCKET } from '../../api/utils';


export default function FAQ() {
  const [faqData, setFaqData] = useState({
    generalInfo: [],
    bagongApps: [],
    passengerBaggage: [],
    payment: [],
    baggage: []
  });
  const [activeCategory, setActiveCategory] = useState('generalInfo');
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQData();
  }, []);

  async function loadFAQData() {
    try {
      const response = await fetch(`${BUCKET}/faq.json?t=${Date.now()}`);
      const result = await response.json();
      
      setFaqData(result.faq || {
        generalInfo: [],
        bagongApps: [],
        passengerBaggage: [],
        payment: [],
        baggage: []
      });
    } catch (e) {
      console.error('Error loading FAQ:', e);
      setFaqData({
        generalInfo: [],
        bagongApps: [],
        passengerBaggage: [],
        payment: [],
        baggage: []
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(index) {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }

  function renderAnswer(answer) {
    if (typeof answer === 'string') {
      return <p>{answer}</p>;
    }

    if (answer.type === 'html') {
      return <div dangerouslySetInnerHTML={{ __html: answer.content }} />;
    }

    if (answer.type === 'list') {
      return (
        <ul>
          {answer.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
    }

    if (answer.type === 'mixed') {
      return answer.content.map((item, i) => {
        if (item.type === 'text') {
          return item.bold ? <strong key={i}>{item.text}</strong> : <p key={i}>{item.text}</p>;
        }
        if (item.type === 'list') {
          return (
            <ul key={i}>
              {item.items.map((listItem, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: listItem }} />
              ))}
            </ul>
          );
        }
        return null;
      });
    }

    return <p>{answer}</p>;
  }

  const categories = [
    { key: 'generalInfo', label: 'Informasi Umum' },
    { key: 'bagongApps', label: 'Bagong Bus Apps' },
    { key: 'passengerBaggage', label: 'Penumpang & Barang Bawaan' },
    { key: 'payment', label: 'Pembayaran' },
    { key: 'baggage', label: 'Bagasi' }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Memuat FAQ...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pusat Bantuan</h1>
        <p>Temukan jawaban untuk pertanyaan yang sering diajukan</p>
      </div>

      <div className={styles.categoryTabs}>
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`${styles.tab} ${activeCategory === cat.key ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.faqList}>
        {faqData[activeCategory]?.map((item, index) => (
          <div key={item.id} className={styles.faqItem}>
            <div 
              className={styles.question}
              onClick={() => toggleItem(index)}
            >
              <h3>{item.question}</h3>
              <span className={`${styles.icon} ${expandedItems[index] ? styles.expanded : ''}`}>
                ▼
              </span>
            </div>
            {expandedItems[index] && (
              <div 
                className={styles.answer}
                style={{ maxHeight: item.maxHeight ? `${item.maxHeight}px` : 'none' }}
              >
                {renderAnswer(item.answer)}
              </div>
            )}
          </div>
        ))}
        
        {faqData[activeCategory]?.length === 0 && (
          <div className={styles.empty}>
            Belum ada FAQ untuk kategori ini
          </div>
        )}
      </div>
    </div>
  );
}
