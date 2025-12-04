import React, { useState } from 'react';

const InputArea = ({ options, onOptionSelect, disabled }) => {
    return (
        <div className="input-area">
            <div className="options-grid">
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
        </div>
    );
};

export default InputArea;
