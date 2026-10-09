/** A blinking light's own delay and period, so lights side by side blink out of step. */
export const blinkStyle = (k: number) => ({
  animationDelay: `${-((k * 0.37) % 1.3).toFixed(2)}s`,
  animationDuration: `${(0.9 + ((k * 0.53) % 0.8)).toFixed(2)}s`,
})
