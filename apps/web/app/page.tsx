'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music, Zap, Sparkles, Circle, Triangle, Square, Badge, Waves, Headphones, Volume2, Wand2, Brain, Clock, Award, Users, Trophy, Heart, Flame, Music2 } from 'lucide-react';
import './globals.css';

// Types
type Mode = {
  id: number;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  category: string;
  color: string;
  bgGradient: string;
};

// MODES Array - 18 game modes with categories
const MODES: Mode[] = [
  // Pitch Recognition
  {
    id: 1,
    name: 'Pitch Match',
    description: 'Match the played note to its name',
    icon: Music,
    category: 'Pitch Recognition',
    color: 'ios-blue',
    bgGradient: 'from-ios-blue/20 to-ios-blue/10'
  },
  {
    id: 2,
    name: 'Interval Training',
    description: 'Identify the distance between two notes',
    icon: Zap,
    category: 'Pitch Recognition',
    color: 'ios-purple',
    bgGradient: 'from-ios-purple/20 to-ios-purple/10'
  },
  {
    id: 3,
    name: 'Chord Identification',
    description: 'Recognize different chord types',
    icon: Sparkles,
    category: 'Pitch Recognition',
    color: 'ios-pink',
    bgGradient: 'from-ios-pink/20 to-ios-pink/10'
  },
  {
    id: 4,
    name: 'Scale Degrees',
    description: 'Identify scale degrees in context',
    icon: Circle,
    category: 'Pitch Recognition',
    color: 'ios-orange',
    bgGradient: 'from-ios-orange/20 to-ios-orange/10'
  },

  // Rhythm & Timing
  {
    id: 5,
    name: 'Rhythm Match',
    description: 'Match rhythmic patterns',
    icon: Triangle,
    category: 'Rhythm & Timing',
    color: 'ios-green',
    bgGradient: 'from-ios-green/20 to-ios-green/10'
  },
  {
    id: 6,
    name: 'Tempo Detection',
    description: 'Identify beats per minute',
    icon: Square,
    category: 'Rhythm & Timing',
    color: 'ios-teal',
    bgGradient: 'from-ios-teal/20 to-ios-teal/10'
  },
  {
    id: 7,
    name: 'Beat Subdivision',
    description: 'Feel and identify subdivisions',
    icon: Badge,
    category: 'Rhythm & Timing',
    color: 'ios-lime',
    bgGradient: 'from-ios-lime/20 to-ios-lime/10'
  },
  {
    id: 8,
    name: 'Polyrhythms',
    description: 'Handle complex rhythmic layers',
    icon: Waves,
    category: 'Rhythm & Timing',
    color: 'ios-cyan',
    bgGradient: 'from-ios-cyan/20 to-ios-cyan/10'
  },

  // Audio Effects
  {
    id: 9,
    name: 'EQ Training',
    description: 'Identify frequency boosts/cuts',
    icon: Headphones,
    category: 'Audio Effects',
    color: 'ios-indigo',
    bgGradient: 'from-ios-indigo/20 to-ios-indigo/10'
  },
  {
    id: 10,
    name: 'Compression',
    description: 'Hear dynamic range changes',
    icon: Volume2,
    category: 'Audio Effects',
    color: 'ios-violet',
    bgGradient: 'from-ios-violet/20 to-ios-violet/10'
  },
  {
    id: 11,
    name: 'Reverb & Delay',
    description: 'Identify time-based effects',
    icon: Wand2,
    category: 'Audio Effects',
    color: 'ios-fuchsia',
    bgGradient: 'from-ios-fuchsia/20 to-ios-fuchsia/10'
  },
  {
    id: 12,
    name: 'Distortion',
    description: 'Recognize harmonic saturation',
    icon: Flame,
    category: 'Audio Effects',
    color: 'ios-red',
    bgGradient: 'from-ios-red/20 to-ios-red/10'
  },

  // Advanced Skills
  {
    id: 13,
    name: 'Melodic Dictation',
    description: 'Transcribe melodies by ear',
    icon: Brain,
    category: 'Advanced Skills',
    color: 'ios-blue',
    bgGradient: 'from-ios-blue/20 to-ios-blue/10'
  },
  {
    id: 14,
    name: 'Harmonic Dictation',
    description: 'Transcribe chord progressions',
    icon: Clock,
    category: 'Advanced Skills',
    color: 'ios-purple',
    bgGradient: 'from-ios-purple/20 to-ios-purple/10'
  },
  {
    id: 15,
    name: 'Blind Mixing',
    description: 'Mix using only your ears',
    icon: Award,
    category: 'Advanced Skills',
    color: 'ios-pink',
    bgGradient: 'from-ios-pink/20 to-ios-pink/10'
  },
  {
    id: 16,
    name: 'Frequency Masking',
    description: 'Detect masked frequencies',
    icon: Users,
    category: 'Advanced Skills',
    color: 'ios-orange',
    bgGradient: 'from-ios-orange/20 to-ios-orange/10'
  },

  // Ear Fitness
  {
    id: 17,
    name: 'Daily Ear Training',
    description: 'Quick daily exercises',
    icon: Trophy,
    category: 'Ear Fitness',
    color: 'ios-green',
    bgGradient: 'from-ios-green/20 to-ios-green/10'
  },
  {
    id: 18,
    name: 'Custom Workouts',
    description: 'Create personalized routines',
    icon: Heart,
    category: 'Ear Fitness',
    color: 'ios-teal',
    bgGradient: 'from-ios-teal/20 to-ios-teal/10'
  }
];

// Categories for grouping
const CATEGORIES = [
  { name: 'Pitch Recognition', icon: Music, color: 'ios-blue' },
  { name: 'Rhythm & Timing', icon: Zap, color: 'ios-green' },
  { name: 'Audio Effects', icon: Sparkles, color: 'ios-purple' },
  { name: 'Advanced Skills', icon: Brain, color: 'ios-orange' },
  { name: 'Ear Fitness', icon: Trophy, color: 'ios-pink' }
];

export default function Home() {
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    // Animate hero elements on mount
    setShowFeatures(true);
  }, []);

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Hero Section */}
      <section className="pt-hero-premium relative overflow-hidden">
        {/* Floating Musical Particles */}
        <div className="pt-particles absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="pt-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 15}s`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            >
              {/* Music note symbol */}
              <div className="text-ios-blue/30 text-[12px]">♩</div>
            </div>
          ))}
        </div>

        <div className="relative z-10 px-6 pt-20 pb-24 max-w-5xl mx-auto text-center">
          {/* Animated App Title with Gradient Text */}
          <h1 className="mb-4 pt-gradient-text text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Pitch Therapy
          </h1>
          
          {/* Animated Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            viewport={{ once: true, margin: '-100px' }}
            className="mb-8 text-ios-text/70 text-lg max-w-xl mx-auto"
          >
            Train your musical ear with scientifically-designed exercises
          </motion.p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-ios-card/80 backdrop-blur-sm border border-ios-border/20 text-ios-text font-medium rounded-xl transition-all duration-300 hover:bg-ios-card/90 hover:border-ios-border/30 hover:shadow-ios-glow/20"
              >
                <Music2 className="h-4 w-4" />
                Get Started
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-ios-bg/80 backdrop-blur-sm border border-ios-border/20 text-ios-accent font-medium rounded-xl transition-all duration-300 hover:bg-ios-bg/90 hover:border-ios-border/30 hover:shadow-ios-glow/10"
            >
              <Wand2 className="h-4 w-4" />
              Learn More
            </motion.button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto">
        <h2 className="mb-12 text-3xl md:text-4xl font-bold text-center text-ios-text">
          How It Works
        </h2>
        
        <div className="grid gap-8 md:grid-cols-2">
          {/* Feature 1 */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-col items-center gap-4 p-6 bg-ios-card/50 backdrop-blur-sm rounded-xl border border-ios-border/20 transition-all duration-300 hover:bg-ios-card/60 hover:shadow-ios-glow/10"
          >
            <div className="p-4 bg-ios-blue/10 rounded-xl">
              <Music className="h-8 w-8 text-ios-blue" />
            </div>
            <h3 className="text-lg font-semibold text-ios-text">Personalized Training</h3>
            <p className="text-ios-text/70 text-center max-w-sm">
              Our adaptive algorithm creates custom exercises based on your strengths and weaknesses.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-col items-center gap-4 p-6 bg-ios-card/50 backdrop-blur-sm rounded-xl border border-ios-border/20 transition-all duration-300 hover:bg-ios-card/60 hover:shadow-ios-glow/10"
          >
            <div className="p-4 bg-ios-green/10 rounded-xl">
              <Zap className="h-8 w-8 text-ios-green" />
            </div>
            <h3 className="text-lg font-semibold text-ios-text">Science-Based Methods</h3>
            <p className="text-ios-text/70 text-center max-w-sm">
              Each exercise is designed using proven auditory training techniques from music conservatories.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-col items-center gap-4 p-6 bg-ios-card/50 backdrop-blur-sm rounded-xl border border-ios-border/20 transition-all duration-300 hover:bg-ios-card/60 hover:shadow-ios-glow/10"
          >
            <div className="p-4 bg-ios-purple/10 rounded-xl">
              <Sparkles className="h-8 w-8 text-ios-purple" />
            </div>
            <h3 className="text-lg font-semibold text-ios-text">Progress Tracking</h3>
            <p className="text-ios-text/70 text-center max-w-sm">
              Visualize your improvement over time with detailed statistics and achievement badges.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-col items-center gap-4 p-6 bg-ios-card/50 backdrop-blur-sm rounded-xl border border-ios-border/20 transition-all duration-300 hover:bg-ios-card/60 hover:shadow-ios-glow/10"
          >
            <div className="p-4 bg-ios-pink/10 rounded-xl">
              <Heart className="h-8 w-8 text-ios-pink" />
            </div>
            <h3 className="text-lg font-semibold text-ios-text">Daily Workouts</h3>
            <p className="text-ios-text/70 text-center max-w-sm">
              Stay consistent with quick daily exercises that fit into any schedule.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Section */}
      <section className="px-6 pt-24 pb-20">
        <h2 className="mb-12 text-2xl md:text-3xl font-bold text-center text-ios-text relative">
          Explore Training Categories
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-ios-gradient-to-r"></div>
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <motion.div
              key={category.name}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1, transition: { delay: CATEGORIES.indexOf(category) * 0.1, type: 'spring', stiffness: 300, damping: 20 } }}
              viewport={{ once: true }}
              className="pt-card-glow flex flex-col items-center gap-4 p-6 bg-ios-card/70 backdrop-blur-sm rounded-2xl border border-ios-border/20 transition-all duration-400 hover:bg-ios-card/80 hover:shadow-ios-glow/20 hover:-translate-y-2"
            >
              <div className="p-4 rounded-xl" style={{ background: `var(--ios-${category.color})/10` }}>
                <category.icon className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold text-ios-text">{category.name}</h3>
              <p className="text-ios-text/60 text-center max-w-sm">
                Specialized exercises to master this skill area
              </p>
              <Link href="/app" className="mt-4 text-ios-accent/80 hover:text-ios-accent font-medium">
                Browse {category.name.toLowerCase()} →
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Modes Grid */}
      <section className="px-6 pt-24 pb-20">
        <h2 className="mb-12 text-2xl md:text-3xl font-bold text-center text-ios-text relative">
          All Training Modes
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-ios-gradient-to-r"></div>
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode) => (
            <motion.div
              key={mode.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1, transition: { delay: MODES.indexOf(mode) * 0.05, type: 'spring', stiffness: 300, damping: 20 } }}
              viewport={{ once: true }}
              className="pt-card-glow flex flex-col items-center gap-4 p-6 bg-ios-card/70 backdrop-blur-sm rounded-2xl border border-ios-border/20 transition-all duration-400 hover:bg-ios-card/80 hover:shadow-ios-glow/20 hover:-translate-y-2"
              style={{ backgroundImage: `linear-gradient(135deg, transparent, var(--ios-${mode.color})/5, transparent)` }}
            >
              <div className="p-4 rounded-xl" style={{ background: `var(--ios-${mode.color})/15` }}>
                <mode.icon className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold text-ios-text">{mode.name}</h3>
              <p className="text-ios-text/60 text-center max-w-sm">{mode.description}</p>
              <Link href="/app" className="mt-4 flex items-center gap-2 text-ios-accent/80 hover:text-ios-accent font-medium">
                Play Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ios-border/20">
        <div className="px-6 pt-12 pb-8 max-w-5xl mx-auto text-center">
          <p className="mb-6 text-ios-text/60">
            Pitch Therapy &copy; {new Date().getFullYear()} - Made with 🎵 for musicians
          </p>
          
          <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="text-ios-text/60 hover:text-ios-text transition-colors duration-200">
              <Music className="h-5 w-5" />
            </a>
            <a href="#" className="text-ios-text/60 hover:text-ios-text transition-colors duration-200">
              <Users className="h-5 w-5" />
            </a>
            <a href="#" className="text-ios-text/60 hover:text-ios-text transition-colors duration-200">
              <Trophy className="h-5 w-5" />
            </a>
            <a href="#" className="text-ios-text/60 hover:text-ios-text transition-colors duration-200">
              <Flame className="h-5 w-5" />
            </a>
          </div>
          
          <p className="text-ios-text/40 text-sm">
            Designed for iOS · Privacy Policy · Terms of Service
          </p>
        </div>
      </footer>
    </div>
  );
}

// ArrowRight component for links
function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      className={`h-4 w-4 ${className}`}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}