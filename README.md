# BERGWALDPROJEKT AI Impact Tracker

> **⚠️ DEMO PROJECT: This project is for demonstration purposes only and is not intended for production use. Data, flows, and integrations may be incomplete or simulated.**

**BERGWALDPROJEKT AI Impact Tracker** is a Chrome extension and landing page that helps users understand and offset the ecological impact of their AI usage. The project combines real-time tracking of digital resource consumption (energy, water, CO₂, etc.) with a seamless donation flow to support reforestation and restoration projects by Bergwaldprojekt.

## Features

- **Chrome Extension**:  
  - Tracks your AI usage (tokens, energy, water, CO₂, messages).
  - Displays your ecological footprint in a modern, card-based popup.
  - Provides a direct link to offset your impact via donation.

- **Landing Page**:  
  - Consistent branding and UI with the extension.
  - Hero section with grouped stats and impact snapshot.
  - Restoration level picker and donation flow (Stripe integration).
  - Trust indicators, social proof, and clear CTAs.
  - Responsive, accessible, and visually appealing design.

- **Branding**:  
  - Uses the official Bergwaldprojekt logo and label.
  - Natural, forest-inspired color palette and iconography.

## Tech Stack

- HTML, CSS, JavaScript (Vanilla)
- Chrome Extension APIs
- Stripe (for payments)
- Supabase (for backend, if used)
- Responsive, modern CSS (no frameworks)

## Development

- All UI/UX is designed for consistency between the extension and landing page.
- Early return patterns are used in JavaScript for clarity and maintainability.
- The project is managed via Git, with feature branches and safe merging practices.

## File Structure

- `background.js`, `content.js`, `popup.js`, `manifest.json` — Chrome extension core
- `donation-landing.html` — Main landing page
- `bergwaldprojekt-logo`, `bergwaldprojekt-label` — Branding assets
- `supabase.js`, `donation-backend.js` — Backend integration
- `icons/` — Extension icons
- `README.md` — This file

## Setup

1. **Chrome Extension**:  
   - Load the extension in Chrome via `chrome://extensions` → "Load unpacked" → select project folder.
   - Use the popup to view your AI impact.

2. **Landing Page**:  
   - Open `donation-landing.html` in your browser or deploy to a static host.
   - Use the donation flow to offset your impact.

3. **Development**:  
   - Clone the repo, create feature branches, and follow early return and modern UI/UX best practices.

## Contributing

- Please open issues or pull requests for bugs, features, or improvements.
- Follow the established code style and UI/UX patterns.

## License

MIT
