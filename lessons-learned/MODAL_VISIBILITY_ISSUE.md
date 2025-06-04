# Modal Visibility Issue

## Problem
Modal function runs successfully (console logs show execution) but modal not visible on screen.

## Symptoms
- `showConfigurationModal()` executes without errors
- `modal.style.display = 'block'` is set
- Modal element exists in DOM
- No visual modal appears

## Root Cause
Base modal CSS (`css/components/modals.css`) uses:
```css
.modal {
  opacity: 0;
  display: none;
}

.modal.open {
  display: flex;
  opacity: 1;
}
```

Setting only `display: block` leaves `opacity: 0` - modal invisible.

## Solution
```javascript
// Wrong:
modal.style.display = 'block';

// Correct:
modal.style.display = 'flex';
modal.classList.add('open');
```

Also update close function:
```javascript
modal.classList.remove('open');
modal.style.display = 'none';
```

## Prevention
Always check base modal CSS patterns before implementing new modals. Look for required classes like `open` for visibility.
