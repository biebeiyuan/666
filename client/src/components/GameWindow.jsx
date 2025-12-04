import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 智能分段函数 - 将长文本分成合适的段落（每段约60-80字）
const splitIntoSegments = (text, maxLength = 70) => {
    if (!text) return [];

    // 首先尝试按换行符分段
    let segments = text.split('\n').filter(p => p.trim() !== '');

    // 对每个段落再次检查是否需要进一步分割
    const finalSegments = [];

    for (const segment of segments) {
        if (segment.length <= maxLength) {
            finalSegments.push(segment.trim());
        } else {
            // 按句子分段
            const sentenceDelimiters = /([。！？!?.，,；;：:]+)/g;
            const parts = segment.split(sentenceDelimiters).filter(s => s);

            let currentSegment = '';

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                // 如果是分隔符，添加到当前段落
                if (sentenceDelimiters.test(part)) {
                    currentSegment += part;
                    // 如果当前段落够长了（超过40字），保存并开始新段落
                    if (currentSegment.length >= 40) {
                        finalSegments.push(currentSegment.trim());
                        currentSegment = '';
                    }
                } else {
                    // 如果加上这部分会太长，先保存当前段落
                    if (currentSegment.length + part.length > maxLength && currentSegment.length > 0) {
                        finalSegments.push(currentSegment.trim());
                        currentSegment = '';
                    }
                    currentSegment += part;
                }
            }

            if (currentSegment.trim()) {
                finalSegments.push(currentSegment.trim());
            }
        }
    }

    if (finalSegments.length === 0) {
        finalSegments.push(text);
    }

    return finalSegments;
};

// 获取上一步玩家动作（用于上下文提示）
const getLastAction = (history) => {
    if (history.length < 2) return null;
    // 倒序查找最近的玩家动作
    for (let i = history.length - 2; i >= 0; i--) {
        if (history[i].type === 'action') {
            return history[i].action;
        }
    }
    return null;
};

// 单页剧情显示组件 - 只显示当前段落，点击后切换
const StoryDisplay = ({ text, lastAction, onComplete, onReadingStateChange }) => {
    const segments = splitIntoSegments(text);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayedChars, setDisplayedChars] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const currentText = segments[currentIndex] || '';
    const isLastSegment = currentIndex >= segments.length - 1;
    const typingComplete = displayedChars >= currentText.length;
    const totalSegments = segments.length;

    // 当text变化时，重置所有状态
    useEffect(() => {
        setCurrentIndex(0);
        setDisplayedChars(0);
        setIsFinished(false);
        if (onReadingStateChange) {
            onReadingStateChange(false);
        }
    }, [text]);

    // 打字机效果 - 加快速度
    useEffect(() => {
        if (!currentText || typingComplete) return;
        const timer = setTimeout(() => {
            setDisplayedChars(prev => prev + 2); // 每次显示2个字符，加快速度
        }, 25);
        return () => clearTimeout(timer);
    }, [displayedChars, typingComplete, currentText]);

    // 重置当前段落的打字状态（切换段落时）
    useEffect(() => {
        if (currentIndex > 0) {
            setDisplayedChars(0);
        }
    }, [currentIndex]);

    // 点击处理
    const handleClick = () => {
        if (!typingComplete) {
            // 跳过打字动画
            setDisplayedChars(currentText.length);
        } else if (!isLastSegment) {
            // 显示下一段
            setCurrentIndex(prev => prev + 1);
        } else if (!isFinished) {
            // 全部显示完毕，标记为已完成
            setIsFinished(true);
            if (onReadingStateChange) {
                onReadingStateChange(true);
            }
            if (onComplete) {
                onComplete();
            }
        }
    };

    // 如果没有文本，显示占位
    if (!text) {
        return (
            <div className="story-display">
                <div className="story-text story-empty">等待剧情加载...</div>
            </div>
        );
    }

    return (
        <div className="story-display" onClick={handleClick}>
            {/* 上文回顾 - 显示玩家上一步动作 */}
            {lastAction && currentIndex === 0 && (
                <div className="context-hint">
                    你的行动: "{lastAction}"
                </div>
            )}

            {/* 进度指示器 */}
            {totalSegments > 1 && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentIndex + 1) / totalSegments) * 100}%` }}
                    />
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${text.slice(0, 20)}-${currentIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="story-text"
                >
                    {currentText.slice(0, displayedChars)}
                    {!typingComplete && <span className="typing-cursor">▍</span>}
                </motion.div>
            </AnimatePresence>

            {/* 点击提示 */}
            {typingComplete && !isFinished && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="click-hint"
                >
                    {isLastSegment ? '▶ 点击完成' : `▼ 继续 (${currentIndex + 1}/${totalSegments})`}
                </motion.div>
            )}

            {/* 阅读完成提示 */}
            {isFinished && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="read-complete"
                >
                    阅读完毕
                </motion.div>
            )}
        </div>
    );
};

// NPC信息卡片 - 固定在顶部，只用颜色区分态度
const NpcCard = ({ npc }) => {
    const attitudeColors = {
        '友好': '#22c55e',
        '中立': '#eab308',
        '敌对': '#ef4444',
        '警惕': '#f97316'
    };

    const color = attitudeColors[npc.attitude] || attitudeColors['中立'];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="npc-top-card"
            style={{ borderColor: color }}
        >
            <div className="npc-top-header">
                <span className="npc-top-name" style={{ color }}>{npc.name}</span>
                {npc.title && <span className="npc-top-title">{npc.title}</span>}
                <span className="npc-top-attitude" style={{ color }}>{npc.attitude}</span>
            </div>
            <div className="npc-top-desc">{npc.description}</div>
            {npc.dialogue && (
                <div className="npc-top-dialogue" style={{ borderLeftColor: color }}>
                    "{npc.dialogue}"
                </div>
            )}
        </motion.div>
    );
};

// 获取当前场景的NPC（只显示最新的）
const getCurrentNpcs = (history) => {
    if (history.length === 0) return [];
    const lastEntry = history[history.length - 1];
    if (lastEntry.type === 'action' && lastEntry.result && lastEntry.result.npc_encounter) {
        return lastEntry.result.npc_encounter;
    }
    return [];
};

// 获取当前显示的文本
const getCurrentText = (history) => {
    if (history.length === 0) return '';
    const lastEntry = history[history.length - 1];
    if (lastEntry.type === 'scenario') {
        return lastEntry.content.description;
    }
    if (lastEntry.type === 'action' && lastEntry.result) {
        return lastEntry.result.result_text;
    }
    return '';
};

const GameWindow = ({
    title,
    history,
    playerRank,
    inventory,
    status,
    onItemUse,
    gameOver,
    scoreData,
    onStoryReadComplete,
    hints
}) => {
    const currentNpcs = getCurrentNpcs(history);
    const currentText = getCurrentText(history);
    const lastAction = getLastAction(history);
    const [hintsExpanded, setHintsExpanded] = useState(false);

    return (
        <div className="game-layout">
            {/* 顶部：标题 + 状态 */}
            <div className="game-header">
                <div className="header-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1 className="game-title-main">{title}</h1>
                    {hints && hints.length > 0 && (
                        <div className="hints-header-btn">
                            <button
                                className="hints-toggle-btn-small"
                                onClick={() => setHintsExpanded(!hintsExpanded)}
                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                            >
                                ⚠️ 提示 ({hints.length})
                            </button>
                        </div>
                    )}
                </div>
                {playerRank && (
                    <div className="player-status">
                        <span className="rank-badge">{playerRank}</span>
                        <span className="status-text">{status}</span>
                    </div>
                )}

                {/* 提示面板 - 绝对定位在头部下方 */}
                <AnimatePresence>
                    {hintsExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="hints-panel-top"
                            style={{
                                background: 'rgba(0,0,0,0.9)',
                                border: '1px solid var(--accent-color)',
                                borderRadius: '8px',
                                marginTop: '0.5rem',
                                overflow: 'hidden',
                                zIndex: 100
                            }}
                        >
                            <ul className="hints-list" style={{ padding: '0.5rem', margin: 0, listStyle: 'none' }}>
                                {hints.map((hint, idx) => (
                                    <li key={idx} className="hint-item" style={{ padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
                                        {hint}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 上方：NPC区域（固定） */}
            <div className="npc-area">
                <AnimatePresence mode="wait">
                    {currentNpcs.length > 0 ? (
                        <motion.div
                            key="npcs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="npc-container"
                        >
                            {currentNpcs.map((npc, idx) => (
                                <NpcCard key={idx} npc={npc} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            className="npc-empty"
                        >
                            暂无角色出现
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 中下方：剧情区域 */}
            <div className="story-area">
                {gameOver && scoreData ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="score-card-center"
                    >
                        <h2>行动报告</h2>
                        <div className="score-rank-big" data-rank={scoreData.rank}>{scoreData.rank || 'F'}</div>
                        <div className="score-value">评分: {scoreData.score}</div>
                        <div className="score-comment">"{scoreData.comment}"</div>
                    </motion.div>
                ) : (
                    <>
                        <StoryDisplay
                            text={currentText}
                            lastAction={lastAction}
                            onReadingStateChange={onStoryReadComplete}
                        />
                    </>
                )}
            </div>

            {/* 底部：背包 */}
            {inventory && inventory.length > 0 && (

                {/* 底部：背包 */ }
            {inventory && inventory.length > 0 && (
                <div className="inventory-bar">
                    <div className="inventory-label">背包</div>
                    <div className="inventory-items">
                        {inventory.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => onItemUse && onItemUse(item)}
                                className="inventory-item"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameWindow;
