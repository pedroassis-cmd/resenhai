# Design System Document: Premium Athletic Editorial

## 1. Overview & Creative North Star: "The Kinetic Gallery"
This design system moves away from the static, boxy nature of standard sports apps. Our Creative North Star is **The Kinetic Gallery**. We treat every screen as a high-end editorial spread—think *Nike Journal* meets *ESPN Investigative*. 

To break the "template" look, we utilize **Intentional Asymmetry**. We do not center everything. We use aggressive typography scales where headers might bleed toward the edge, and cards use "Surface Nesting" to create depth without the clutter of drop shadows. The goal is a digital experience that feels fast, prestigious, and engineered.

---

## 2. Color Architecture & Tonal Depth
We define hierarchy through atmospheric shifts rather than structural lines.

### The Palette
*   **Surface:** `#07100B` (The deep, obsidian pitch)
*   **Primary (Action):** `#1CB85B` (Electric Pitch Green)
*   **Secondary (Alert):** `#F59E0B` (Competition Amber)
*   **Tertiary (Guest):** `#A78BFA` (Vapor Purple)
*   **Accent (Info):** `#38BDF8` (Velocity Blue)

### The "No-Line" Rule
**Strict Mandate:** 1px solid borders for sectioning are prohibited. Boundaries must be defined solely through background color shifts. 
*   Use `surface-container-low` (`#0B1610`) for the main background.
*   Use `surface-container` (`#101C16`) for secondary groupings.
*   Use `surface-container-highest` (`#1B2921`) for interactive card elements.
This creates a "molded" look where elements appear carved out of the interface rather than pasted onto it.

### Signature Textures: The "Velocity Blur"
To move beyond a flat dark mode, use **Glassmorphism** for floating headers or navigation bars.
*   **Token:** `surface-variant` (`#1B2921`) at 70% opacity.
*   **Effect:** `backdrop-blur: 20px`. 
This allows the vibrant Primary Green or Guest Purple of background content to "ghost" through the UI as the user scrolls, maintaining a sense of constant motion.

---

## 3. Typography: Editorial Authority
We pair the brutalist weight of **Syne** with the utilitarian precision of **DM Sans**.

*   **Display & Headlines (Syne, 800):** Use for scores, player names, and "Big Moment" titles. These should be tight (letter-spacing: -0.04em) to feel aggressive and impactful.
*   **Titles & Body (DM Sans):** Use for data points, descriptions, and labels. DM Sans provides the "Pro-Tool" feel that balances the loud headers.

**The Power Scale:**
*   **Display LG (3.5rem):** For hero stats or countdowns.
*   **Headline MD (1.75rem):** For section starts.
*   **Body MD (0.875rem):** For all standard reading.

---

## 4. Elevation & Depth: The Layering Principle
Since we have abolished traditional shadows, depth is achieved through **Tonal Stacking**.

*   **Level 0 (Base):** `surface` (`#07100B`) - The stadium floor.
*   **Level 1 (Section):** `surface-container-low` (`#0B1610`) - Large structural groupings.
*   **Level 2 (Card):** `surface-container-high` (`#16221B`) - Interactive units.
*   **Level 3 (Overlay):** `surface-bright` (`#202F27`) - Active states or pressed cards.

**The Ghost Border Fallback:**
If accessibility requires a container edge (e.g., in high-sunlight outdoor use), use a **Ghost Border**: `outline-variant` (`#404A44`) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Primitive Styling

### Buttons (The "Engineered" Look)
*   **Primary:** Background `primary-container` (`#1CB85B`), Text `on-primary-container` (`#00290E`). Radius: `10px`. 
*   **Secondary:** Background `outline-variant` (`#404A44`) at 30% opacity. No border.
*   **Tertiary/Guest:** Background `tertiary-container` (`#A589F8`).

### Cards & Lists (The "Non-Grid" Approach)
*   **Radius:** `16px` for external corners.
*   **Spacing:** Use `spacing-6` (1.5rem) to separate cards. **Never use divider lines.**
*   **Internal Nesting:** If a list exists inside a card, the list items should be `surface-container-highest` against a card background of `surface-container`.

### Pills & Status Tags
*   **Shape:** `full` (9999px).
*   **Style:** Minimalist. Use a subtle `primary_dim` text on a `primary` background at 10% opacity for a "soft glow" effect.

### Input Fields
*   **Styling:** Understated. Use `surface-container-lowest` (`#000000`) as the fill. 
*   **Active State:** Change the `outline` to `primary` (`#69F58F`) but only at 1.5px thickness to match the icon stroke.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. Try a 24px left margin and a 16px right margin for headline elements to create an editorial "pull."
*   **Do** use 1.5px stroke icons exclusively. Heavy icons will break the "Premium" feel.
*   **Do** use high-contrast color pairings (e.g., Amber text on Dark Green surfaces) for critical game alerts.

### Don't:
*   **Don’t** use `#000000` for cards. It kills the "Sports Dark Mode" depth. Stick to the `surface-container` tiers.
*   **Don’t** use standard shadows. If an element must float, use a 32px blur shadow with the color `#000000` at 40% opacity—this mimics "Ambient Occlusion" rather than a "Drop Shadow."
*   **Don’t** use dividers. If you feel the need for a line, increase the vertical white space by one step on the spacing scale instead.

---

## 7. Signature Elements for this App
*   **The "Match Glass":** A floating navigation bar using 80% transparency and heavy backdrop blur, pinned to the bottom of the iPhone 14 Pro dynamic island area.
*   **The "Stat Overlap":** Allow large `Syne` weight 800 numbers (e.g., "07") to be partially obscured by a player's head or a card edge to create 3D spatial depth.