import React, { useState, useEffect, useRef } from 'react';
import BlurText from "./TextAnimations/BlurText/BlurText";
import Noise from './Animations/Noise/Noise';
import { motion, AnimatePresence } from "motion/react";
import { Fireworks } from '@fireworks-js/react';

// -------------------------
// 缓动函数库
// -------------------------
const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

// -------------------------
// 特效基类及子类
// -------------------------
class BaseEffect {
  constructor(config) {
    this.type = config.type;
    this.start = config.start;       // 特效开始时间（秒）
    this.end = config.end;           // 特效结束时间（秒）
    this.params = config.params;
    this.ease = Easing[config.ease || 'easeInOutQuad'];
    this.fadeIn = config.params.fadeIn || 1;  // 渐入时间（秒）
    this.fadeOut = config.params.fadeOut || 1; // 渐出时间（秒）
  }

  calculateIntensity(currentTime) {
    if (currentTime < this.start - this.fadeIn) return 0;
    if (currentTime > this.end + this.fadeOut) return 0;

    if (currentTime < this.start) {
      const progress = (currentTime - (this.start - this.fadeIn)) / this.fadeIn;
      return this.ease(progress);
    }
    if (currentTime <= this.end) {
      return 1;
    }
    const progress = 1 - ((currentTime - this.end) / this.fadeOut);
    return this.ease(progress);
  }
}

class NoiseEffect extends BaseEffect {
  applyParams(intensity) {
    return {
      patternAlpha: intensity * this.params.maxAlpha,
      patternSize: this.params.size,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut
    };
  }
}

// （原 blur 效果保留，仅供参考）  
class BlurEffect extends BaseEffect {
  applyParams(intensity) {
    return {
      blurAmount: intensity * this.params.maxBlur,
      color: `rgba(255,255,255,${intensity * 0.2})`
    };
  }
}

// 新增：烟花效果配置类
class FireworksEffectConfig extends BaseEffect {
  applyParams(intensity) {
    return {
      // 可根据 intensity 调整 opacity
      opacity: intensity * (this.params.opacity || 1),
      options: this.params.options || {}
    };
  }
}

// 特效工厂：支持 noise、fireworks 以及 blur（如有需要）
const createEffect = (config) => {
  switch (config.type) {
    case 'noise':
      return new NoiseEffect(config);
    case 'fireworks':
      return new FireworksEffectConfig(config);
    case 'blur':
      return new BlurEffect(config);
    default:
      return null;
  }
};

// -------------------------
// SRT 解析函数（歌词解析）
// -------------------------
const parseSRT = (srt) => {
  const lyrics = [];
  const blocks = srt.split(/\r?\n\r?\n/);
  blocks.forEach(block => {
    const lines = block.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const timeRegex = /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
      const match = timeLine.match(timeRegex);
      if (match) {
        const start =
          parseInt(match[1], 10) * 3600 +
          parseInt(match[2], 10) * 60 +
          parseInt(match[3], 10) +
          parseInt(match[4], 10) / 1000;
        const end =
          parseInt(match[5], 10) * 3600 +
          parseInt(match[6], 10) * 60 +
          parseInt(match[7], 10) +
          parseInt(match[8], 10) / 1000;
        const text = lines.slice(2).join(' ');
        lyrics.push({ start, end, text });
      }
    }
  });
  return lyrics;
};

// -------------------------
// App 组件
// -------------------------
function App() {
  const [lyrics, setLyrics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentLyric, setCurrentLyric] = useState("");
  const [lyricDelay, setLyricDelay] = useState(150);
  const [isClimax, setIsClimax] = useState(false);
  const audioRef = useRef(null);
  const thresholdRef = useRef(1); // 默认阈值
  const statsRef = useRef({ average: 0, stdDev: 0 });

  // 更新特效时间线配置
  const effectTimeline = [
    { 
      type: 'noise',
      start: 1,
      end: 12.5,
      params: {
        maxAlpha: 50,
        size: 300,
        fadeIn: 2.5,
        fadeOut: 1
      }
    },
    {
      type: 'fireworks',
      start: 1,
      end: 12.5,
      params: {
        opacity: 0.8,
        fadeIn: 2.5,
        fadeOut: 1,
      }
    },
    {
      type: 'noise',
      start: 270,
      end: 291,
      params: {
        maxAlpha: 30,
        size: 300,
        fadeIn: 2.5,
        fadeOut: 1
      }
    },
    
  ];

  const [activeEffects, setActiveEffects] = useState([]);

  // 更新特效状态：根据音频当前时间计算激活效果
  const updateEffects = (currentTime) => {
    console.log("当前时间:", currentTime);
    const effects = effectTimeline
      .map(config => createEffect(config))
      .filter(effect => {
        if (!effect) return false;
        return currentTime >= (effect.start - effect.fadeIn) && 
               currentTime <= (effect.end + effect.fadeOut);
      })
      .map(effect => {
        const intensity = effect.calculateIntensity(currentTime);
        return {
          type: effect.type,
          params: effect.applyParams(intensity),
          config: effect
        };
      });
    console.log("当前激活特效:", effects);
    setActiveEffects(effects);
  };

  // 渲染特效：使用 AnimatePresence + motion.div 控制效果的进出场动画
  const renderEffects = () => {
    return (
      <AnimatePresence>
        {activeEffects.map((effect, index) => {
          switch (effect.type) {
            case 'noise':
              return (
                <motion.div
                  key={`noise-${index}`}
                  className="fixed top-0 left-0 w-full h-full pointer-events-none z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: effect.config.fadeIn }}
                >
                  <Noise
                    patternSize={Number(effect.params.patternSize)}
                    patternScaleX={1}
                    patternScaleY={1}
                    patternRefreshInterval={2}
                    patternAlpha={60}
                  />
                </motion.div>
              );
            case 'fireworks':
              return (
                <motion.div
                  key={`fireworks-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: effect.params.opacity }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: effect.config.fadeIn }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    // 将烟花效果置于背景（低 z-index）且不阻止点击事件
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                >
                  <Fireworks
                    options={effect.params.options}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </motion.div>
              );
            default:
              return null;
          }
        })}
      </AnimatePresence>
    );
  };

  // 合并更新函数
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    updateLyrics();
    updateEffects(currentTime);
  };

  // SRT 歌词解析及动态阈值计算
  useEffect(() => {
    const srtText = `
      1
      00:00:00,000 --> 00:00:01,000
       作词 : Luna Yamada

      2
      00:00:01,000 --> 00:00:02,309
       作曲 : Rui Nakata/Trinh Vu Dung

      3
      00:00:02,309 --> 00:00:12,770
       雨は晴れ花びらが舞い落ちる

      4
      00:00:12,770 --> 00:00:23,712
       過ぎる季節 君といた夏に今咲いた

      5
      00:00:45,712 --> 00:00:55,654
       快晴と波の反射に映る

      6
      00:00:55,654 --> 00:01:05,080
       横顔と君の姿に夢中で

      7
      00:01:05,080 --> 00:01:09,801
       静寂を覆う蝉の鳴き声

      8
      00:01:09,801 --> 00:01:14,604
       すれ違う遠く離れた鼓動

      9
      00:01:14,604 --> 00:01:19,481
       無口な君に僕はただ

      10
      00:01:19,481 --> 00:01:25,720
       振り向いて 欲しいだけ

      11
      00:01:25,720 --> 00:01:30,894
       ねぇ君に届くだろうか

      12
      00:01:30,894 --> 00:01:35,853
       ねぇ日がさあ消えゆく前に

      13
      00:01:35,853 --> 00:01:44,917
       手を差し伸べて今

      14
      00:01:44,917 --> 00:01:48,972
       行こう

      15
      00:02:28,972 --> 00:02:32,396
       Last night 君と

      16
      00:02:32,396 --> 00:02:34,088
       Passed by 時が

      17
      00:02:34,088 --> 00:02:39,747
       Close by 映る花が散って

      18
      00:02:39,747 --> 00:02:42,326
       bright light 君に

      19
      00:02:42,326 --> 00:02:44,913
       伝わるの?

      20
      00:02:44,913 --> 00:02:48,618
       この気持ちは...

      21
      00:02:48,618 --> 00:02:53,501
       喧騒としている僕の鼓動と

      22
      00:02:53,501 --> 00:02:59,268
       世界がきらめき今君糸結び

      23
      00:02:59,268 --> 00:03:03,906
       赤く火照るかわいい顔にね

      24
      00:03:03,906 --> 00:03:09,072
       好きだよと　tell you 今すぐ

      25
      00:04:31,072 --> 00:04:36,164
       手を繋ぐ

      26
      00:04:36,164 --> 00:04:41,192
       照れた顔

      27
      00:04:41,192 --> 00:04:46,233
       僕の心

      28
      00:04:46,233 --> 00:04:55,585
       花のように咲いた
    `;
    const parsedLyrics = parseSRT(srtText);
    parsedLyrics.sort((a, b) => a.start - b.start);

    // 计算歌词间隔统计信息
    if (parsedLyrics.length > 1) {
      const gaps = [];
      for (let i = 1; i < parsedLyrics.length; i++) {
        gaps.push(parsedLyrics[i].start - parsedLyrics[i - 1].end);
      }
      const average = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const stdDev = Math.sqrt(
        gaps.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / gaps.length
      );
      const dynamicThreshold = Math.max(average + 2 * stdDev, 1);
      thresholdRef.current = dynamicThreshold;
      statsRef.current = { average, stdDev };
    }
    setLyrics(parsedLyrics);
  }, []);

  const updateLyrics = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    let low = 0, high = lyrics.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (currentTime >= lyrics[mid].end) {
        low = mid + 1;
      } else if (currentTime < lyrics[mid].start) {
        high = mid - 1;
      } else {
        const found = lyrics[mid];
        const newIndex = mid;
        let isClimaxDetected = false;
        const prevGap = mid > 0 ? found.start - lyrics[mid - 1].end : 0;
        const nextGap = mid < lyrics.length - 1 ? lyrics[mid + 1].start - found.end : 0;
        if (prevGap > thresholdRef.current || nextGap > thresholdRef.current) {
          isClimaxDetected = true;
        }
        if (isClimaxDetected) {
          const blankDuration = Math.max(prevGap, nextGap);
          if (currentTime > found.end - 0.5 && currentTime < found.end + blankDuration - 0.5) {
            setIsClimax(true);
            return;
          }
        }
        if (currentTime >= found.end - 0.1 && currentTime < found.end) {
          setCurrentIndex(newIndex + 1);
          setCurrentLyric(lyrics[newIndex + 1]?.text || '');
          return;
        }
        if (newIndex !== currentIndex) {
          setIsClimax(false);
          setCurrentIndex(newIndex);
          setCurrentLyric(found.text);
        }
        return;
      }
    }
    setIsClimax(false);
    setCurrentLyric("");
    setCurrentIndex(-1);
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    audioElement?.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audioElement?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [lyrics]);

  useEffect(() => {
    updateLyrics();
  }, [lyrics]);

  useEffect(() => {
    if (!lyrics.length || currentIndex < 0 || currentIndex >= lyrics.length) return;
    const currentBlock = lyrics[currentIndex];
    const duration = currentBlock.end - currentBlock.start;
    const length = currentLyric.length;
    const computedDelay = Math.floor((duration * 1000) / (length || 1));
    const maxAnimationTimeSec = 0.8;
    const maxDelay = Math.floor((maxAnimationTimeSec * 1000) / (length || 1));
    const finalDelay = Math.min(Math.max(350, computedDelay), maxDelay);
    setLyricDelay(finalDelay);
  }, [currentIndex, lyrics, currentLyric]);

  return (
    <div className="h-screen bg-black text-white font-bold flex flex-col justify-center items-center">
      {renderEffects()}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {currentLyric && !isClimax && (
          <BlurText
            key={currentIndex}
            text={currentLyric}
            animateBy="letters"
            direction="top"
            delay={lyricDelay}
            className="text-6xl mb-8 text-center"
            onAnimationComplete={() => {
              console.log("动画结束, 当前歌词索引:", currentIndex);
            }}
          />
        )}
        {isClimax && (
          <BlurText
            key={"climax"}
            text=""
            animateBy="letters"
            direction="top"
            delay={lyricDelay}
            className="text-6xl mb-8 text-center opacity-0"
            onAnimationComplete={() => {
              console.log("高潮部分动画结束");
              setIsClimax(false);
            }}
          />
        )}
      </div>
      <audio
        ref={audioRef}
        controls
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-4"
      >
        <source src="Suisei Works,Yuura. - Natsuzora No Hanabi.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export default App;
