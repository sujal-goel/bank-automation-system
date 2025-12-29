/**
 * Demo component to showcase comprehensive touch gesture functionality
 * This can be used for testing and demonstration purposes
 */

'use client';

import { useState } from 'react';
import useTouchGestures from '../../hooks/useTouchGestures';
import ResponsiveButton from '../ui/ResponsiveButton';
import SwipeableCard from '../ui/SwipeableCard';
import { TouchForm, TouchInput, TouchSelect, TouchCheckbox } from '../ui/TouchForm';

export default function SwipeDemo() {
  const [gestureLog, setGestureLog] = useState([]);
  const [activeGesture, setActiveGesture] = useState('');

  const addGestureLog = (gesture, data = {}) => {
    const timestamp = new Date().toLocaleTimeString();
    setGestureLog(prev => [
      { gesture, data, timestamp, id: Date.now() },
      ...prev.slice(0, 9), // Keep only last 10 entries
    ]);
    setActiveGesture(gesture);
    setTimeout(() => setActiveGesture(''), 1000);
  };

  const { touchHandlers } = useTouchGestures({
    onTap: (data) => addGestureLog('Tap', data),
    onDoubleTap: (data) => addGestureLog('Double Tap', data),
    onLongPress: (data) => addGestureLog('Long Press', data),
    onSwipeLeft: (data) => addGestureLog('Swipe Left', data),
    onSwipeRight: (data) => addGestureLog('Swipe Right', data),
    onSwipeUp: (data) => addGestureLog('Swipe Up', data),
    onSwipeDown: (data) => addGestureLog('Swipe Down', data),
    onPinchStart: (data) => addGestureLog('Pinch Start', data),
    onPinchMove: (data) => addGestureLog('Pinch Move', data),
    onPinchEnd: () => addGestureLog('Pinch End'),
    threshold: 50,
    hapticFeedback: true,
  });

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Touch Gesture Demo</h2>
      
      {/* Main gesture area */}
      <div 
        className="bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[200px] flex flex-col justify-center items-center touch-none"
        {...touchHandlers}
      >
        <div className="text-lg font-medium text-gray-700 mb-2">
          Try different touch gestures
        </div>
        
        {activeGesture && (
          <div className="text-2xl font-bold text-blue-600 mb-2 animate-bounce-gentle">
            {activeGesture}!
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-4">
          Tap • Double Tap • Long Press • Swipe • Pinch (multi-touch)
        </div>
        
        <div className="text-xs text-gray-400 max-w-xs">
          This area detects all touch gestures with haptic feedback on mobile devices
        </div>
      </div>

      {/* Touch-friendly buttons demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Touch-Friendly Buttons</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ResponsiveButton 
            variant="primary"
            onClick={() => addGestureLog('Button Click', { button: 'Primary' })}
          >
            Primary
          </ResponsiveButton>
          <ResponsiveButton 
            variant="secondary"
            onClick={() => addGestureLog('Button Click', { button: 'Secondary' })}
          >
            Secondary
          </ResponsiveButton>
          <ResponsiveButton 
            variant="outline"
            onClick={() => addGestureLog('Button Click', { button: 'Outline' })}
          >
            Outline
          </ResponsiveButton>
          <ResponsiveButton 
            variant="ghost"
            size="icon"
            onClick={() => addGestureLog('Button Click', { button: 'Icon' })}
            icon={<span>🎯</span>}
          >
            Icon Button
          </ResponsiveButton>
        </div>
      </div>

      {/* Swipeable cards demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Swipeable Cards</h3>
        <div className="space-y-3">
          <SwipeableCard
            onSwipeLeft={() => addGestureLog('Card Swipe Left')}
            onSwipeRight={() => addGestureLog('Card Swipe Right')}
            onTap={() => addGestureLog('Card Tap')}
            onLongPress={() => addGestureLog('Card Long Press')}
            leftAction={<span>✓ Accept</span>}
            rightAction={<span>✗ Reject</span>}
          >
            <div className="p-4">
              <h4 className="font-medium">Swipeable Card 1</h4>
              <p className="text-sm text-gray-600">Swipe left/right for actions, tap or long press</p>
            </div>
          </SwipeableCard>
          
          <SwipeableCard
            onSwipeLeft={() => addGestureLog('Card Swipe Left')}
            onSwipeRight={() => addGestureLog('Card Swipe Right')}
            onTap={() => addGestureLog('Card Tap')}
          >
            <div className="p-4">
              <h4 className="font-medium">Swipeable Card 2</h4>
              <p className="text-sm text-gray-600">Another card with gesture support</p>
            </div>
          </SwipeableCard>
        </div>
      </div>

      {/* Touch-friendly form demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Touch-Friendly Form Elements</h3>
        <TouchForm onSubmit={() => addGestureLog('Form Submit')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TouchInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              icon="📧"
            />
            <TouchInput
              label="Phone"
              type="phone"
              placeholder="Enter your phone"
              icon="📱"
            />
            <TouchSelect
              label="Country"
              options={[
                { value: 'us', label: 'United States' },
                { value: 'ca', label: 'Canada' },
                { value: 'uk', label: 'United Kingdom' },
              ]}
            />
            <TouchInput
              label="Amount"
              type="currency"
              placeholder="0.00"
              icon="💰"
            />
          </div>
          
          <TouchCheckbox
            label="I agree to the terms and conditions"
          />
          
          <ResponsiveButton type="submit" fullWidth>
            Submit Form
          </ResponsiveButton>
        </TouchForm>
      </div>

      {/* Gesture log */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Gesture Log</h3>
          <ResponsiveButton 
            variant="outline" 
            size="sm"
            onClick={() => setGestureLog([])}
          >
            Clear Log
          </ResponsiveButton>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
          {gestureLog.length === 0 ? (
            <p className="text-gray-500 text-center">No gestures detected yet</p>
          ) : (
            <div className="space-y-2">
              {gestureLog.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{entry.gesture}</span>
                  <span className="text-gray-500">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}