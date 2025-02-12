import { useRef, useEffect } from 'react';

const Noise = ({
  patternSize = 250,
  /** 噪点在 Canvas 上的缩放 */
  patternScaleX = 1,
  patternScaleY = 1,
  /**
   * 噪点刷新间隔，单位：毫秒
   * 如果需要保持胶片随机闪烁感，可以设为 16~200 (即帧/毫秒级)
   * 如果不希望频繁闪烁，可以设为 500~2000 甚至更大
   */
  patternRefreshInterval = 1000,
  /**
   * 噪点像素的透明度 (0~255)
   * 通常可以设置较小的值，比如 15~60
   * 值越大，噪点越明显
   */
  patternAlpha = 30,
  /** 容器透明度(0~1)，用于实现淡入淡出 */
  fadeOpacity = 1,
  /** 容器过渡动画样式，如 'opacity 1s ease-in-out' */
  fadeTransition = 'opacity 1s ease-in-out',
}) => {
  const grainRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 创建离屏 canvas 用于生成噪点图案
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');
    const patternData = patternCtx.createImageData(patternSize, patternSize);
    const data = patternData.data;
    const totalPixels = patternSize * patternSize; // 预先计算像素总数

    // 根据设备像素比调整 canvas 尺寸和缩放
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      if (ctx.resetTransform) {
        ctx.resetTransform();
      }
      ctx.scale(patternScaleX * dpr, patternScaleY * dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 更新离屏噪点图案数据
    const updatePattern = () => {
      // 遍历每个像素，使用位运算确保整数化
      for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        // 使用 (Math.random() * 256) | 0 快速获得 0~255 内的整数
        const value = (Math.random() * 256) | 0;
        data[offset] = value;       // R
        data[offset + 1] = value;   // G
        data[offset + 2] = value;   // B
        data[offset + 3] = patternAlpha; // A
      }
      patternCtx.putImageData(patternData, 0, 0);
    };

    // 将离屏图案绘制到主 canvas 上
    const drawGrain = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // 初次生成噪点图案
    updatePattern();
    drawGrain();

    let lastUpdate = performance.now();

    // 利用 requestAnimationFrame 控制刷新频率
    const animate = (time) => {
      if (time - lastUpdate >= patternRefreshInterval) {
        updatePattern();
        drawGrain();
        lastUpdate = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <div
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{
        opacity: fadeOpacity,
        transition: fadeTransition,
      }}
    >
      <canvas
        ref={grainRef}
        className="w-full h-full"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default Noise;
