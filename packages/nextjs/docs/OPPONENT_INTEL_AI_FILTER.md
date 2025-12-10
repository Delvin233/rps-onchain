# Opponent Intel - AI Match Filter

## Feature

Added a toggle to show/hide AI matches in the Opponent Intel page to reduce clutter and focus on multiplayer matches.

## Why This Feature?

- **AI matches don't provide intel**: AI opponents have random patterns, so there's no strategic value in studying them
- **Reduces clutter**: Players often have many AI matches that make it harder to find multiplayer matches
- **User control**: Players can still view AI matches if they want to see their full history

## Implementation

### UI Changes

**File**: `packages/nextjs/app/history/page.tsx`

Added a checkbox toggle in the header section:

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={showAIMatches}
    onChange={e => setShowAIMatches(e.target.checked)}
    className="checkbox checkbox-sm checkbox-primary"
  />
  <span className="text-sm text-base-content/80">Show AI matches</span>
</label>
```

### Filtering Logic

- **Default state**: `showAIMatches = false` (AI matches hidden by default)
- **Filter function**: Filters out matches where `match.opponent === "AI"` when toggle is off
- **Load More button**: Correctly counts filtered matches for pagination

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Opponent Intel                                          │
├─────────────────────────────────────────────────────────┤
│  [✓] Show AI matches        [🔄 Refresh] [📤 Sync IPFS] │
├─────────────────────────────────────────────────────────┤
│  Match Cards (filtered based on toggle)                 │
└─────────────────────────────────────────────────────────┘
```

## User Experience

### Default View (AI matches hidden)

- Only multiplayer matches are shown
- Cleaner view focused on strategic intel
- Easier to find specific opponents

### With AI matches shown

- All matches (AI + multiplayer) are displayed
- Useful for reviewing full match history
- Can verify AI win counts

## Technical Details

### State Management

```tsx
const [showAIMatches, setShowAIMatches] = useState(false);
```

### Filter Implementation

```tsx
matches
  .filter(match => {
    const isAiMatch = match.opponent === "AI";
    return showAIMatches || !isAiMatch;
  })
  .slice(0, displayCount)
  .map((match, index) => {
    // Render match cards
  });
```

### Pagination

The "Load More" button correctly counts filtered matches:

```tsx
const filteredMatches = matches.filter(match => {
  const isAiMatch = match.opponent === "AI";
  return showAIMatches || !isAiMatch;
});
// Show button if there are more filtered matches to display
displayCount < filteredMatches.length;
```

## Benefits

1. **Cleaner interface**: Focus on matches that provide strategic value
2. **Better UX**: Easier to find and study specific opponents
3. **Flexible**: Users can toggle AI matches on if needed
4. **Performance**: Fewer cards rendered by default (faster page load)

## Related Files

- `/app/history/page.tsx` - Main implementation
- `/docs/OPPONENT_INTEL_FEATURE.md` - Original feature documentation
- `/docs/OPPONENT_INTEL_PHASE1_COMPLETE.md` - Phase 1 completion notes
