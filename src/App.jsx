import React, { useState, useEffect, useRef } from 'react';
import BlurText from "./TextAnimations/BlurText/BlurText";
import Noise from './Animations/Noise/Noise';
// SRT 解析函数：解析 SRT 格式歌词文本
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

function App() {
  const [lyrics, setLyrics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentLyric, setCurrentLyric] = useState("");
  const [lyricDelay, setLyricDelay] = useState(150);
  const [isClimax, setIsClimax] = useState(false);
  const audioRef = useRef(null);
  const thresholdRef = useRef(1); // 默认阈值
  const statsRef = useRef({ average: 0, stdDev: 0 });

   // 新增特效时间轴配置
   const effectTimeline = [
    { 
      start: 0,   // 开始时间（秒）
      end: 12,     // 结束时间（秒）
      type: 'noise',
      params: {
        patternAlpha: 50,  // 噪点透明度
        patternSize: 300,  // 噪点尺寸
        fadeDuration: 1,   // 渐入渐出的时间（秒）
        //duration: 12       // 整个特效的持续时间（秒）
      }
    },
    { 
      start: 270,   // 开始时间（秒）
      end: 296,     // 结束时间（秒）
      type: 'noise',
      params: {
        patternAlpha: 50,  // 噪点透明度
        patternSize: 300,  // 噪点尺寸
        fadeDuration: 1,   // 渐入渐出的时间（秒）
        //duration: 12       // 整个特效的持续时间（秒）
      }
    }
  ];
  

  // 新增特效状态
  const [activeEffect, setActiveEffect] = useState(null);

  // 更新特效状态的函数
  const updateEffects = (currentTime) => {
    const active = effectTimeline.find(effect => 
      currentTime >= effect.start && currentTime <= effect.end
    );
  
    if (active) {
      // 计算渐入渐出的透明度
      const fadeInStart = active.start;
      const fadeInEnd = active.start + active.params.fadeDuration;
      const fadeOutStart = active.end - active.params.fadeDuration;
      const fadeOutEnd = active.end;
  
      let alpha = active.params.patternAlpha;
  
      if (currentTime < fadeInEnd) {
        // 渐入阶段
        alpha = (currentTime - fadeInStart) / active.params.fadeDuration * active.params.patternAlpha;
      } else if (currentTime > fadeOutStart) {
        // 渐出阶段
        alpha = (fadeOutEnd - currentTime) / active.params.fadeDuration * active.params.patternAlpha;
      }
  
      setActiveEffect({
        ...active,
        params: {
          ...active.params,
          patternAlpha: Math.max(0, alpha) // 确保透明度不会小于0
        }
      });
    } else {
      setActiveEffect(null);
    }
  };
  

  


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
00:04:36,264 --> 00:04:41,192
 照れた顔

27
00:04:41,192 --> 00:04:46,233
 僕の心

28
00:04:46,233 --> 00:04:55,585
 花のように咲いた
  `; // 你的 SRT 文本

  // 合并更新函数
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    updateLyrics();
    updateEffects(currentTime);
  };


  useEffect(() => {
    const parsedLyrics = parseSRT(srtText);
    parsedLyrics.sort((a, b) => a.start - b.start);

    // 计算歌词间隔统计信息
    if (parsedLyrics.length > 1) {
      const gaps = [];
      for (let i = 1; i < parsedLyrics.length; i++) {
        gaps.push(parsedLyrics[i].start - parsedLyrics[i-1].end);
      }

      // 计算平均值和标准差
      const average = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const stdDev = Math.sqrt(
        gaps.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / gaps.length
      );

      const dynamicThreshold = Math.max(average + 2 * stdDev, 0.001);
      thresholdRef.current = dynamicThreshold;
      statsRef.current = { average, stdDev };
    }

    setLyrics(parsedLyrics);
    // 在useEffect末尾添加调试输出
    console.log('动态阈值计算完成', {
      average: statsRef.current.average,
      stdDev: statsRef.current.stdDev,
      threshold: thresholdRef.current
    });
  }, []);



  const updateLyrics = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
  
    // 使用二分查找优化查找效率
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
  
        // 检查前后间隔
        let isClimaxDetected = false;
        const prevGap = mid > 0 ? found.start - lyrics[mid-1].end : 0;
        const nextGap = mid < lyrics.length-1 ? lyrics[mid+1].start - found.end : 0;
  
        // 动态阈值判断
        if (prevGap > thresholdRef.current || nextGap > thresholdRef.current) {
          isClimaxDetected = true;
        }
  
        // 处理高潮段落前后的空白
        if (isClimaxDetected) {
          // 计算空白持续时间
          const blankDuration = Math.max(prevGap, nextGap);
          
          // 根据空白时长调整显示逻辑
          if (currentTime > found.end - 0.5 && currentTime < found.end + blankDuration - 0.5) {
            setIsClimax(true);
            return;
          }
        }
  
        // 处理接近时间重叠的情况
        if (currentTime >= found.end - 0.1 && currentTime < found.end) {
          // 当前时间接近上一段歌词的结束时间，强制显示下一个段落
          setCurrentIndex(newIndex + 1);
          setCurrentLyric(lyrics[newIndex + 1]?.text || '');
          return;
        }
  
        // 正常歌词处理
        if (newIndex !== currentIndex) {
          setIsClimax(false);
          setCurrentIndex(newIndex);
          setCurrentLyric(found.text);
        }
        return;
      }
    }
  
    // 没有找到匹配歌词
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
    const maxAnimationTimeSec = 0.2;
    const maxDelay = Math.floor((maxAnimationTimeSec * 1000) / (length || 1));
    const finalDelay = Math.min(Math.max(20, computedDelay), maxDelay);
    setLyricDelay(finalDelay);
  }, [currentIndex, lyrics, currentLyric]);

  return (
    <div className="h-screen bg-black text-white font-bold flex flex-col justify-center items-center">
      {/* 新增特效层 */}
      {activeEffect && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-10">
          <Noise
            key={`${activeEffect.start}-${activeEffect.end}`}
            patternSize={activeEffect.params.patternSize}
            patternScaleX={1}
            patternScaleY={1}
            patternRefreshInterval={2}
            patternAlpha={activeEffect.params.patternAlpha}  // 动态透明度
          />
        </div>
      )}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {currentLyric && !isClimax && (
          <BlurText
            key={currentIndex}  // 强制重新挂载
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

        {/* 如果是高潮部分，显示空白 */}
        {isClimax && (
          <BlurText
            key={"climax"}  // 使用不同的 key 以强制更新
            text=""
            animateBy="letters"v
            direction="top"
            delay={lyricDelay}
            className="text-6xl mb-8 text-center opacity-0" // 空白并且不可见
            onAnimationComplete={() => {
              console.log("高潮部分动画结束");
              setIsClimax(false);  // 结束后恢复
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
