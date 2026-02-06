# Mission Control Agent Avatars

Custom vector avatars for all 5 Mission Control agents, inspired by Cartoon Network characters.

## Agents

### 1. Dexter 🧪
- **Character:** Genius scientist with Asian features
- **Style:** Lab coat, wild hair, oversized round glasses
- **Colors:** Blue (#00d4ff), white
- **Vibe:** Smart, curious, slightly manic energy

### 2. Blossom 🌸
- **Character:** Powerpuff Girl style leader
- **Style:** Pink theme, big bow, confident pose
- **Colors:** Pink (#ff006e), black
- **Vibe:** Leader, organized, gets things done

### 3. Samurai Jack ⚔️
- **Character:** Serious samurai warrior
- **Style:** Topknot, traditional robes, katana
- **Colors:** Yellow (#ffb703), black, white
- **Vibe:** Disciplined, master craftsman, stoic

### 4. Johnny Bravo 🕶️
- **Character:** Confident salesman type
- **Style:** Blonde pompadour, sunglasses, buff
- **Colors:** Purple (#8338ec), black
- **Vibe:** Cocky but charming, sales bro energy

### 5. Courage 🐾
- **Character:** Small pink dog, loyal but anxious
- **Style:** Spotted fur, big worried eyes
- **Colors:** Teal (#00f5d4), pink
- **Vibe:** Anxious but loyal, always watching out

## Files

### SVG (Recommended for Web)
- `dexter.svg` - 3KB
- `blossom.svg` - 4KB
- `samurai-jack.svg` - 3KB
- `johnny-bravo.svg` - 3KB
- `courage.svg` - 4KB

### PNG (200x200px)
- `dexter.png` - 15KB
- `blossom.png` - 15KB
- `samurai-jack.png` - 14KB
- `johnny-bravo.png` - 15KB
- `courage.png` - 19KB

### Circular Versions
Both SVG and PNG formats available with `-circle` suffix for use in chat interfaces.

## Usage

### Dashboard
The avatars are integrated into the Mission Control Dashboard at `mission-control/dashboard/index.html`:
- Agent status cards (48px avatars)
- Chat messages (32px avatars)
- Task table (20px avatars)

### CSS Classes
```css
.agent-avatar-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
}
```

### Direct Embedding
```html
<!-- SVG (scalable, recommended) -->
<img src="assets/agents/dexter.svg" alt="Dexter" style="width: 48px; height: 48px; border-radius: 50%;">

<!-- PNG (fallback) -->
<img src="assets/agents/dexter.png" alt="Dexter" style="width: 48px; height: 48px; border-radius: 50%;">
```

## Design Notes

- All avatars are 200x200px viewBox SVGs
- Consistent circular frame with colored borders matching each agent's theme
- Colors match the Mission Control dashboard design system
- Flat design style with subtle gradients for depth
- Optimized for web use with small file sizes
