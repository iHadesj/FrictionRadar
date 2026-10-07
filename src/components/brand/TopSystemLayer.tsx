import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { BrandMark } from './BrandMark'
import { SystemStatus } from './SystemStatus'

/** Top layer floats on the field (no bar, no box) and compacts as content scrolls under it. */
export function TopSystemLayer({ online, todayCount, todayLoad }: { online: boolean; todayCount: number; todayLoad: number }) {
  const { intro } = useMotionPreferences()
  const { scrollY } = useScroll()
  const [compact, setCompact] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setCompact(y > 48))
  const shade = useTransform(scrollY, [0, 120], [0, 1])

  return (
    <header className="top-layer">
      <motion.div className="top-layer__shade" style={{ opacity: shade }} aria-hidden="true" />
      <BrandMark intro={intro} compact={compact} />
      <SystemStatus online={online} todayCount={todayCount} todayLoad={todayLoad} />
    </header>
  )
}
