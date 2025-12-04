import React from 'react';
import { motion } from 'framer-motion';

const GameWindow = ({ title, description, resultText, playerRank, inventory, status, onItemUse }) => {
    return (
        <div className="game-window">
            <div className="flex justify-between items-start mb-4">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold"
                    style={{ color: 'var(--accent-color)' }}
                >
                    {title}
                </motion.h1>
                {playerRank && (
                    <div className="text-right text-sm text-gray-400">
                        <div>禁闭者等级: <span className="text-red-500 font-bold">{playerRank}</span></div>
                        <div>状态: {status}</div>
                    </div>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="description mb-6"
                style={{ fontSize: '1.2rem', marginBottom: '2rem' }}
            >
                {description}
            </motion.div>

            {inventory && inventory.length > 0 && (
                <div className="mb-4 p-2 bg-gray-900 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">背包物品 (点击使用)</div>
                    <div className="flex gap-2 flex-wrap">
                        {inventory.map((item, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => onItemUse && onItemUse(item)}
                                className="px-2 py-1 bg-gray-800 rounded text-sm text-blue-300 border border-blue-900 hover:bg-blue-900 hover:text-white transition-colors cursor-pointer"
                                title={`点击使用 ${item}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {resultText && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="result p-4 bg-slate-800 rounded mb-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}
                >
                    {resultText}
                </motion.div>
            )}
        </div>
    );
};

export default GameWindow;
