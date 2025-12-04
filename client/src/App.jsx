import React, { useState } from 'react';
import axios from 'axios';
import GameWindow from './components/GameWindow';
import InputArea from './components/InputArea';
import Timer from './components/Timer';
import './index.css';

const THEMES = [
  {
    id: 'cyberpunk_novel',
    name: '穿进赛博游戏',
    description: '赛博朋克未来，七大区财团统治，义体改造与地下反抗军的博弈。'
  },
  {
    id: 'path_to_nowhere',
    name: '无期迷途',
    description: '身处狄斯城（辛迪加/新城/MBCC），身为禁闭者的你，需要在狂厄与混乱中求生。'
  },
  {
    id: 'chinese_folklore',
    name: '中式民俗',
    description: '偏远山村，封建迷信，纸人冥婚，诡异的民俗仪式。你为了寻找失踪的亲人回到故乡。'
  },
  {
    id: 'tomb_raiding',
    name: '盗墓探险',
    description: '分金定穴，点烛开棺。在机关重重的古墓中寻找失落的秘宝，小心"粽子"。'
  }
];

function App() {
  const [gameState, setGameState] = useState({
    started: false,
    loading: false,
    title: '开启逃生',
    description: '欢迎来到 AI 生成的逃生密室。请选择主题并开始游戏。',
    options: [],
    resultText: '',
    gameOver: false,
    history: [],
    inventory: [],
    playerRank: null,
    status: '正常'
  });

  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].id);

  const startGame = async () => {
    setGameState(prev => ({ ...prev, loading: true, resultText: '' }));
    try {
      const response = await axios.post('/api/generate-scenario', {
        theme: selectedTheme,
        difficulty: '普通'
      });

      setGameState(prev => ({
        ...prev,
        started: true,
        loading: false,
        title: response.data.title,
        description: response.data.description,
        options: response.data.initial_options,
        history: [{ type: 'scenario', content: response.data }],
        inventory: response.data.inventory || [],
        playerRank: response.data.player_rank || null,
        status: response.data.status || '正常'
      }));
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        resultText: '启动游戏失败。请检查后端连接。'
      }));
    }
  };

  const handleTimeUp = () => {
    setGameState(prev => ({
      ...prev,
      gameOver: true,
      resultText: '时间到！你没能逃脱...'
    }));
  };

  const handleAction = async (action) => {
    if (!gameState.started) return;
    
    // Special handling for item usage if action string format is "使用 [Item]"
    // No special logic needed here as the backend will interpret "使用 X" correctly
    // but we can add UI feedback if desired.

    setGameState(prev => ({ ...prev, loading: true }));

    try {
      // Get last 5 history items for context, filtering out system messages if needed
      const recentHistory = gameState.history.slice(-5);

      const currentContext = {
        title: gameState.title,
        description: gameState.description,
        last_result: gameState.resultText,
        theme: selectedTheme,
        inventory: gameState.inventory,
        status: gameState.status,
        playerRank: gameState.playerRank,
        history: recentHistory
      };

      const response = await axios.post('/api/submit-action', {
        action,
        currentContext
      });

      const result = response.data;

      setGameState(prev => ({
        ...prev,
        loading: false,
        resultText: result.result_text,
        options: result.new_options || [],
        gameOver: result.game_over,
        inventory: result.inventory || prev.inventory,
        status: result.status || prev.status,
        history: [...prev.history, { type: 'action', action, result }]
      }));

    } catch (error) {
      console.error('Failed to submit action:', error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        resultText: '处理动作失败。'
      }));
    }
  };

  const resetGame = () => {
    setGameState({
      started: false,
      loading: false,
      title: '开启逃生',
      description: '欢迎来到 AI 生成的逃生密室。请选择主题并开始游戏。',
      options: [],
      resultText: '',
      gameOver: false,
      history: []
    });
  };

  // Helper to get current theme description
  const currentThemeDesc = THEMES.find(t => t.id === selectedTheme)?.description;

  return (
    <div className="game-container" style={{ position: 'relative' }}>
      {gameState.started && !gameState.gameOver && (
        <Timer duration={30 * 60} onTimeUp={handleTimeUp} />
      )}

      {gameState.loading && <div style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>思考中...</div>}

      {!gameState.started ? (
        <div className="start-screen glass-panel">
          <h1 className="game-title">
            开启逃生
          </h1>
          <div className="theme-selection">
            <label className="theme-label">选择剧本主题：</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="theme-select"
            >
              {THEMES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="theme-description" style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
              {currentThemeDesc}
            </div>
          </div>
          <button onClick={startGame} className="start-btn">
            开启逃生 (30分钟)
          </button>
        </div>
      ) : (
        <>
          <GameWindow
            title={gameState.title}
            description={gameState.description}
            resultText={gameState.resultText}
            playerRank={gameState.playerRank}
            inventory={gameState.inventory}
            status={gameState.status}
            onItemUse={(item) => handleAction(`使用 ${item}`)}
          />

          {!gameState.gameOver && (
            <InputArea
              options={gameState.options}
              onOptionSelect={handleAction}
              onCustomAction={handleAction}
              disabled={gameState.loading}
            />
          )}

          {gameState.gameOver && (
            <div className="mt-8">
              <h2 className="text-2xl text-red-500 mb-4">游戏结束</h2>
              <div className="mb-4">{gameState.resultText}</div>
              <button onClick={resetGame}>再玩一次</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
