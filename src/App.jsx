import React, { useRef, useEffect } from 'react';
import { getProject } from '@theatre/core';
import studio from '@theatre/studio';

if (process.env.NODE_ENV === 'development') {
  studio.initialize();
}

const GuSheet = getProject('Gu Project').sheet('Gu Sheet');

function App() {
  const lyricsRefs = useRef([]);
  const lyrics = [
    '雨は晴れ花びらが舞い落ちる',
    '過ぎる季節 君といた夏に今咲いた',
    '快晴と波の反射に映る',
    '横顔と君の姿に夢中で',
    '静寂を覆う蝉の鳴き声',
    'すれ違う遠く離れた鼓動',
    '無口な君に僕はただ',
    '振り向いて 欲しいだけ',
    'ねぇ君に届くだろうか',
    'ねぇ日がさあ消えゆく前に',
    '手を差し伸べて今',
    '行こう',
    'Last night 君と',
    'Passed by 時が',
    'Close by 映る花が散って',
    'bright light 君に',
    '伝わるの?',
    'この気持ちは...',
    '喧騒としている僕の鼓動と',
    '世界がきらめき今君糸結び',
    '赤く火照るかわいい顔にね',
    '好きだよと tell you 今すぐ 手を繋ぐ',
    '照れた顔',
    '僕の心',
    '花のように咲いた'
  ];

  useEffect(() => {
    lyricsRefs.current = lyricsRefs.current.slice(0, lyrics.length);
  }, [lyrics]);

  useEffect(() => {
    const objects = lyricsRefs.current.map((ref, index) =>
      GuSheet.object(`lyric-${index}`, {
        x: 0,
        y: 0,
        blur: 0,
        opacity: 0,
      })
    );

    // 保存所有的取消订阅函数
    const unsubscribeFunctions = objects.map((obj, index) => {
      return obj.onValuesChange((values) => {
        const el = lyricsRefs.current[index];
        if (el) {
          el.style.transform = `translate(${values.x}px, ${values.y}px) translateX(-50%)`;
          el.style.filter = `blur(${values.blur}px)`;
          el.style.opacity = values.opacity;
          //设置字体大小
          el.style.fontSize = `${values.opacity * 1.5}rem`;
        }
      });
    });

    // 清理时调用所有取消订阅函数
    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [lyricsRefs]);

  const startPlayback = async () => {
    const sequence = GuSheet.sequence;
    await sequence.attachAudio({ source: 'music.mp3' }); // 替换为你的音频文件
    sequence.play();
  };

  const pausePlayback = () => {
    GuSheet.sequence.pause();
  };

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <h1 className="text-3xl font-bold text-white text-center pt-4">歌词动画</h1>
      {lyrics.map((line, index) => (
        <div
          key={index}
          ref={(el) => (lyricsRefs.current[index] = el)}
          className="text-white text-xl text-center mb-2"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'blur(0px)',
            opacity: 0,
          }}
        >
          {line}
        </div>
      ))}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          onClick={startPlayback}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300"
        >
          开始播放
        </button>
        <button
          onClick={pausePlayback}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300"
        >
          暂停
        </button>
      </div>
    </div>
  );
}

export default App;