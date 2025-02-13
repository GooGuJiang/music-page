import { motion, AnimatePresence } from "motion/react"
import { useMemo } from 'react'

const BlurText = ({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
}) => {
  const elements = useMemo(() => 
    animateBy === 'words' ? text.split(' ') : text.split(''),
    [text, animateBy]
  )

  // 优化后的动画配置
  const transition = (index) => ({
    delay: index * delay / 1000,
    duration: 0.8,
    ease: [0, 0.25, 0.25, 0.25] // 更平滑的缓动曲线
  })

  // 调整后的动画变量
  const animationVariants = {
    initial: (index) => ({
      opacity: 0,
      filter: 'blur(12px)',
      y: direction === 'top' ? 12 : -12, // 减少位移幅度
      x: 0
    }),
    enter: (index) => ({
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: transition(index)
    }),
    exit: (index) => ({
      opacity: 0,
      filter: 'blur(8px)', // 减少模糊度
      y: direction === 'top' ? -12 : 12, // 对称位移
      transition: {
        ...transition(index),
        duration: 0.6 // 更快的退出速度
      }
    })
  }

  return (
    <div className={`${className} inline-block relative`}>
      <AnimatePresence 
        mode="sync" // 改为同步模式
        onExitComplete={onAnimationComplete}
      >
        <motion.span 
          className="inline-block whitespace-pre-wrap break-words"
          layout // 启用布局动画
          transition={{ type: "spring", duration: 0.5 }}
        >
          {elements.map((element, index) => (
            <motion.span
              key={`${element}-${index}-${text}`} // 添加 text 到 key
              custom={index}
              variants={animationVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="inline-block"
              style={{ 
                position: 'relative', // 相对定位防止布局错乱
                transition: 'all 0.3s ease' // 添加基础过渡
              }}
            >
              {element}
              {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export default BlurText