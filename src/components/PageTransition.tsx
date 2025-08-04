import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -30,
      scale: 0.98
    }
  };

  // Page transition timing
  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.6
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default PageTransition; 