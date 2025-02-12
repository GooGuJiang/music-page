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
    const totalPixels = patternSize * patternSize;

    // 将传入的 patternAlpha 限定在 0～255 内，并转为整数
    const clampedAlpha = Math.max(0, Math.min(255, Math.floor(patternAlpha)));

    // 根据设备像素比调整主 canvas 尺寸和缩放
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      // 重置当前变换矩阵
      if (ctx.resetTransform) {
        ctx.resetTransform();
      } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // 依据设备像素比及自定义缩放因子进行缩放
      ctx.scale(patternScaleX * dpr, patternScaleY * dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 使用 Uint32Array 优化生成噪点数据（适用于小端系统）
    const updatePattern = () => {
      const buf32 = new Uint32Array(patternData.data.buffer);
      for (let i = 0; i < buf32.length; i++) {
        // 生成一个随机灰度值 (0～255)
        const v = (Math.random() * 256) | 0;
        // 由于 ImageData 内部采用 RGBA 排列，但 Uint32Array 在小端系统中内存布局为 ABGR，
        // 因此组装像素数据时：(clampedAlpha << 24) | (v << 16) | (v << 8) | v 刚好得到 (R,G,B,A)
        buf32[i] = (clampedAlpha << 24) | (v << 16) | (v << 8) | v;
      }
      patternCtx.putImageData(patternData, 0, 0);
    };

    // 将离屏噪点图案绘制到主 canvas 上
    const drawGrain = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    // 初次生成并绘制噪点
    updatePattern();
    drawGrain();

    let lastUpdate = performance.now();

    // 使用 requestAnimationFrame 控制刷新（同时保证刷新间隔约等于 patternRefreshInterval）
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
        willChange: 'opacity', // 提示浏览器提前优化 opacity 渲染
      }}
    >
      <canvas
        ref={grainRef}
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
