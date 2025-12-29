# Mobile Navigation Swipe Gestures

This document describes the swipe gesture functionality implemented in the MobileNavigation component.

## Features

### Sidebar Swipe Gestures
- **Swipe Left to Close**: Users can swipe left on the sidebar to close it
- **Visual Drag Feedback**: The sidebar follows the user's finger during the drag gesture
- **Threshold-based Activation**: Requires a minimum swipe distance (50px) to trigger the close action

### Bottom Navigation Swipe Gestures
- **Swipe Left/Right**: Navigate between tabs by swiping left or right on the bottom navigation
- **Sequential Navigation**: Only allows navigation to adjacent tabs
- **Visual Indicators**: Shows swipe hints to guide users

## Implementation Details

### Custom Hook: `useSwipeGestures`
Located at: `frontend/src/hooks/useSwipeGestures.js`

**Features:**
- Configurable swipe thresholds
- Support for all four directions (left, right, up, down)
- Optional touch event prevention
- Reusable across components

**Parameters:**
```javascript
{
  onSwipeLeft: (deltaX) => void,
  onSwipeRight: (deltaX) => void,
  onSwipeUp: (deltaY) => void,
  onSwipeDown: (deltaY) => void,
  threshold: number = 50,
  preventDefaultTouchmoveEvent: boolean = false,
  deltaThreshold: number = 5
}
```

### Usage in MobileNavigation

#### Sidebar Gestures
```javascript
const sidebarSwipe = useSwipeGestures({
  onSwipeLeft: (deltaX) => {
    if (isOpen && deltaX < -50) {
      onClose();
    }
  },
  threshold: 30,
  preventDefaultTouchmoveEvent: true
});
```

#### Bottom Navigation Gestures
```javascript
const bottomNavSwipe = useSwipeGestures({
  onSwipeLeft: handleBottomNavSwipe,
  onSwipeRight: handleBottomNavSwipe,
  threshold: 50
});
```

## User Experience Enhancements

### Visual Feedback
- **Drag Offset**: Sidebar follows finger movement during swipe
- **Smooth Transitions**: CSS transitions for natural feel
- **Swipe Indicators**: Visual hints showing available gestures

### Accessibility
- **Touch Target Size**: Minimum 44px touch targets
- **Fallback Controls**: Traditional buttons remain available
- **Prevent Scroll**: Body scroll disabled during sidebar drag

### Performance
- **Event Throttling**: Optimized touch event handling
- **Memory Cleanup**: Proper cleanup of event listeners
- **Conditional Rendering**: Only active when needed

## Browser Support

- **iOS Safari**: Full support
- **Android Chrome**: Full support
- **Mobile Firefox**: Full support
- **Desktop**: Gracefully degrades (no touch events)

## Testing

Use the `SwipeDemo` component (`frontend/src/components/demo/SwipeDemo.js`) to test swipe gesture functionality:

```javascript
import SwipeDemo from '../components/demo/SwipeDemo';

// In your page or component
<SwipeDemo />
```

## Configuration

### Adjusting Sensitivity
Modify the `threshold` parameter to change swipe sensitivity:
- Lower values (20-30px): More sensitive
- Higher values (60-80px): Less sensitive
- Default: 50px

### Customizing Behavior
The swipe handlers can be customized for different behaviors:
- Change navigation logic
- Add haptic feedback
- Implement custom animations
- Add sound effects

## Future Enhancements

- **Haptic Feedback**: Add vibration on successful swipes
- **Gesture Animations**: More sophisticated transition animations
- **Multi-touch Support**: Support for pinch and zoom gestures
- **Gesture Customization**: User-configurable gesture preferences