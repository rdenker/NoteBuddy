export const spring = {
  snappy: { type: "spring", stiffness: 400, damping: 35, mass: 0.8 },
  smooth: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
  gentle: { type: "spring", stiffness: 200, damping: 28, mass: 1 },
  bounce: { type: "spring", stiffness: 350, damping: 20, mass: 0.9 },
} as const;

export const ease = {
  out: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  overshoot: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  },
  slideInRight: {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: spring.smooth },
    exit: { x: "100%", opacity: 0, transition: { duration: 0.2, ease: ease.inOut } },
  },
  slideUp: {
    hidden: { y: 12, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: spring.snappy },
    exit: { y: 8, opacity: 0, transition: { duration: 0.12 } },
  },
  scaleIn: {
    hidden: { scale: 0.94, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: spring.snappy },
    exit: { scale: 0.96, opacity: 0, transition: { duration: 0.12 } },
  },
  sidebarCollapse: {
    open: { width: "208px", opacity: 1, transition: spring.smooth },
    closed: { width: 0, opacity: 0, transition: { duration: 0.25, ease: ease.inOut } },
  },
  tabSlideIn: {
    hidden: { width: 0, opacity: 0 },
    visible: { width: "auto", opacity: 1, transition: spring.snappy },
    exit: { width: 0, opacity: 0, transition: { duration: 0.15, ease: ease.inOut } },
  },
  stagger: {
    visible: { transition: { staggerChildren: 0.04 } },
  },
  staggerItem: {
    hidden: { y: 6, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: spring.snappy },
  },
} as const;
