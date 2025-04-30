import React from 'react';

const FindingTalent: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px 40px',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: 'white',
      border: '1px solid #f0f0f0',
      borderRadius: '4px',
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        marginBottom: '20px', 
        textAlign: 'left',
        color: '#000',
        paddingBottom: '10px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        FINDING TALENT
      </h1>
      <ul style={{ 
        listStyleType: 'none', 
        fontSize: '1.25rem', 
        textAlign: 'left',
        lineHeight: '1.5',
        padding: '0',
        margin: '0'
      }}>
        {[
          "Referral Campaigns",
          "Professional recruiters",
          "Digital media",
          "Creative marketing",
          "University",
          "Outsourcing"
        ].map((item, index) => (
          <li 
            key={index} 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '18px 0',
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <span style={{ 
              marginRight: '15px', 
              fontSize: '1rem', 
              color: '#0288d1'
            }}>-</span>
            <span style={{
              fontWeight: 400,
              color: '#333'
            }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FindingTalent; 