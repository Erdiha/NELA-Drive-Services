// animations.js
// Smooth, professional animations for NELA driver app
// Includes pulse effect for online button

import { Animated, Easing } from "react-native";
import theme from "./theme";

// ANIMATION PRESETS
export const animations = {
  // Timing configurations
  timing: {
    instant: theme.animations.duration.instant,
    fast: theme.animations.duration.fast,
    normal: theme.animations.duration.normal,
    slow: theme.animations.duration.slow,
    verySlow: theme.animations.duration.verySlow,
  },

  // Easing functions - Smooth & natural
  easing: {
    linear: Easing.linear,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    spring: Easing.elastic(1),
  },
};

// FADE ANIMATIONS

/**
 * Fade In Animation
 */
export const fadeIn = (animatedValue, duration = 300, toValue = 1) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Fade Out Animation
 */
export const fadeOut = (animatedValue, duration = 200) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

// SLIDE ANIMATIONS

/**
 * Slide In Animation
 */
export const slideIn = (
  animatedValue,
  direction = "up",
  distance = 30,
  duration = 300
) => {
  const startValue =
    direction === "up" || direction === "down"
      ? direction === "up"
        ? distance
        : -distance
      : direction === "left"
      ? distance
      : -distance;

  animatedValue.setValue(startValue);

  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide Out Animation
 */
export const slideOut = (
  animatedValue,
  direction = "down",
  distance = 30,
  duration = 200
) => {
  const endValue =
    direction === "up" || direction === "down"
      ? direction === "up"
        ? -distance
        : distance
      : direction === "left"
      ? -distance
      : distance;

  return Animated.timing(animatedValue, {
    toValue: endValue,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

// SCALE ANIMATIONS

/**
 * Scale Animation - Smooth zoom effect
 */
export const scale = (animatedValue, toValue = 1.05, duration = 200) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Bounce Scale - Quick attention grabber
 */
export const bounceScale = (animatedValue, toValue = 1.1, duration = 400) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue,
      duration: duration / 2,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration / 2,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
};

// PULSE ANIMATION (for Online Button)

/**
 * Continuous Pulse Animation - Perfect for online/offline button
 * Creates a subtle breathing effect
 */
export const createPulse = (animatedValue) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.08,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Glow Pulse - Opacity-based pulse for glow effects
 */
export const createGlowPulse = (animatedValue) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.8,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.3,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

// SPRING ANIMATIONS

/**
 * Spring Animation - Natural bounce
 */
export const spring = (animatedValue, toValue, config = {}) => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
    ...config,
  });
};

// COMBINED ANIMATIONS

/**
 * Fade In + Slide In (for cards appearing)
 */
export const fadeInSlideIn = (fadeValue, slideValue, duration = 300) => {
  return Animated.parallel([
    fadeIn(fadeValue, duration),
    slideIn(slideValue, "up", 20, duration),
  ]);
};

/**
 * Fade Out + Slide Out (for cards disappearing)
 */
export const fadeOutSlideOut = (fadeValue, slideValue, duration = 200) => {
  return Animated.parallel([
    fadeOut(fadeValue, duration),
    slideOut(slideValue, "down", 20, duration),
  ]);
};

// SEQUENCE ANIMATIONS

/**
 * Stagger Animation - Sequential animations with delay
 */
export const stagger = (animations, delay = 50) => {
  return Animated.stagger(delay, animations);
};

/**
 * Parallel Animation - Run multiple animations together
 */
export const parallel = (animations) => {
  return Animated.parallel(animations);
};

/**
 * Sequence Animation - Run animations one after another
 */
export const sequence = (animations) => {
  return Animated.sequence(animations);
};

// ROTATION ANIMATIONS

/**
 * Rotate Animation
 */
export const rotate = (animatedValue, toValue = 1, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.linear,
    useNativeDriver: true,
  });
};

/**
 * Continuous Spin - For loading indicators
 */
export const createSpin = (animatedValue) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

// UTILITY FUNCTIONS

/**
 * Create animated interpolation for rotation
 */
export const createRotateInterpolation = (animatedValue) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
};

/**
 * Create shake animation (for errors/attention)
 */
export const shake = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

export default {
  animations,
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scale,
  bounceScale,
  createPulse,
  createGlowPulse,
  spring,
  fadeInSlideIn,
  fadeOutSlideOut,
  stagger,
  parallel,
  sequence,
  rotate,
  createSpin,
  createRotateInterpolation,
  shake,
};
