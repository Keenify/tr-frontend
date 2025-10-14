import React, { useState, useEffect } from 'react';
import '../styles/SelectionModeBox.css';

interface SelectionModeBoxProps {
  onSelectMode: (mode: 'random' | 'manual') => void;
}

const SelectionModeBox: React.FC<SelectionModeBoxProps> = ({ onSelectMode }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const christmas = new Date(currentYear, 11, 25); // December 25

      // If Christmas has passed this year, calculate for next year
      if (now > christmas) {
        christmas.setFullYear(currentYear + 1);
      }

      const difference = christmas.getTime() - now.getTime();

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="selection-mode-container">
      {/* Christmas Countdown */}
      <div className="christmas-countdown">
        <div className="countdown-title">🎄You  have 🎄</div>
        <div className="countdown-timer">
          <div className="time-unit">
            <span className="time-value">{timeLeft.days}</span>
            <span className="time-label">Days</span>
          </div>
          <span className="time-separator">:</span>
          <div className="time-unit">
            <span className="time-value">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="time-label">Hours</span>
          </div>
          <span className="time-separator">:</span>
          <div className="time-unit">
            <span className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="time-label">Minutes</span>
          </div>
          <span className="time-separator">:</span>
          <div className="time-unit">
            <span className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="time-label">Seconds</span>
          </div>
        </div>
        <div className="countdown-footer">Until Christmas</div>
      </div>

      {/* Snowflakes */}
      <div className="snowflakes" aria-hidden="true">
        <div className="snowflake">❅</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
      </div>

      <div className="selection-mode-header">
        <h2>Choose Your <span className="festive-text">Christmas Gift Box</span></h2>
      </div>

      <div className="selection-boxes">
        {/* Random Selection Box */}
        <div
          className="selection-box random-box"
          onClick={() => onSelectMode('random')}
        >
          <img
            src="/random-selection.png"
            alt="Random Selection"
            className="box-image"
            loading="eager"
            decoding="async"
          />
          <p className="box-caption">Let us surprise you with our selection</p>
        </div>

        {/* Manual Selection Box */}
        <div
          className="selection-box manual-box"
          onClick={() => onSelectMode('manual')}
        >
          <img
            src="/manual-selection.png"
            alt="Manual Selection"
            className="box-image"
            loading="eager"
            decoding="async"
          />
          <p className="box-caption">I want to pick my own products</p>
        </div>
      </div>
    </div>
  );
};

export default SelectionModeBox;
