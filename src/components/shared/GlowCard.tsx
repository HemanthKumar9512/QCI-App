import React from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: React.ReactNode;
  color?: 'cyan' | 'purple' | 'gold' | 'green' | 'red';
  className?: string;
}

const glowMap: Record<string, string> = {
  cyan: 'hover:glow-cyan', purple: 'hover:glow-purple', gold: 'hover:glow-gold',
  green: 'hover:glow-green', red: 'hover:glow-red',
};

const GlowCard: React.FC<GlowCardProps> = ({ children, color = 'cyan', className = '' }) => (
  <motion.div
    className={`bg-card border border-border rounded-lg p-4 transition-all ${glowMap[color]} ${className}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
  >
    {children}
  </motion.div>
);

export default GlowCard;
