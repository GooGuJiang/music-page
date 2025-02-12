import { useRef, useEffect, useState, useMemo } from 'react';
import { useSprings, animated } from '@react-spring/web';

const BlurText = ({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words', // 'words' 或 'letters'
  direction = 'top',   // 'top' 或 'bottom'
  threshold = 0.1,
  rootMargin = '0px',
  easing = 'easeOutCubic',
  onAnimationComplete,
  triggerImmediately = true, // 是否立即触发动画
}) => {
  // 将文本拆分为单词或字符
  const elements = useMemo(() => {
    return animateBy === 'words' ? text.split(' ') : text.split('');
  }, [text, animateBy]);

  const [inView, setInView] = useState(triggerImmediately); // 默认立即触发动画
  const ref = useRef(null);

  useEffect(() => {
    if (triggerImmediately) return;
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggerImmediately, threshold, rootMargin]);

  // 定义动画初始状态：模糊、透明、位置偏移
  const fromState = useMemo(() => ({
    filter: 'blur(10px)',
    opacity: 0,
    transform: direction === 'top' ? 'translate3d(0,-50px,0)' : 'translate3d(0,50px,0)',
  }), [direction]);

  // 定义动画最终状态：清晰、完全显示、位置归位
  const toState = useMemo(() => ({
    filter: 'blur(0px)',
    opacity: 1,
    transform: 'translate3d(0,0,0)',
  }), []);

  // 为每个字/词创建动画配置，每个元素延时为 i * delay
  const springs = useSprings(
    elements.length,
    elements.map((_, i) => ({
      from: fromState,
      to: inView ? toState : fromState,
      delay: i * delay,
      config: { easing },
      onRest: i === elements.length - 1 ? () => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      } : undefined,
    }))
  );

  return (
    <p ref={ref} className={`blur-text ${className} flex flex-wrap`}>
      {springs.map((props, index) => (
        <animated.span
          key={index}
          style={props}
          className="inline-block"
        >
          {elements[index] === ' ' ? '\u00A0' : elements[index]}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </animated.span>
      ))}
    </p>
  );
};

export default BlurText;
