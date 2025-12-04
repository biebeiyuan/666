import React, { useState, useEffect } from 'react';

const Timer = ({ duration, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeUp]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="timer" style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: timeLeft < 60 ? '#ef4444' : 'var(--accent-color)'
        }}>
            {formatTime(timeLeft)}
        </div>
    );
};

export default Timer;
