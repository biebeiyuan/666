import React, { useState } from 'react';

const InputArea = ({ options, onOptionSelect, onCustomAction, disabled }) => {
    const [customInput, setCustomInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (customInput.trim()) {
            onCustomAction(customInput);
            setCustomInput('');
        }
    };

    return (
        <div className="input-area">
            <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onOptionSelect(option)}
                        disabled={disabled}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
                <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="或输入你的行动..."
                    disabled={disabled}
                />
                <button type="submit" disabled={disabled || !customInput.trim()}>
                    执行
                </button>
            </form>
        </div>
    );
};

export default InputArea;
