# NOISE

A single-page web application for recording and visualizing audio "noise" with text captions. Built with React + Vite + Tailwind CSS.

![NOISE App](./preview.png)

## Features

- 🎤 **Audio Recording** - Record audio via browser microphone
- 📊 **Audio Visualization** - Three visualization modes: Waveform, Bars, Spectrum
- ✏️ **Text Captions** - Add and style text labels with custom fonts
- 🖱️ **Drag & Drop** - Move elements freely on the canvas
- 🎨 **Customization** - Resize, change opacity, and style elements
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- MediaRecorder API (audio recording)
- Canvas API (audio visualization)
- Google Fonts (Rubik Glitch, Kapakana, Shadows Into Light)

## Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install Dependencies

```bash
cd noise-app
npm install
```

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Record Audio**
   - Click "Record noise" button
   - Grant microphone permission when prompted
   - Click "Start" to begin recording
   - Click "Stop" to finish
   - Audio appears as a visual element on the canvas

2. **Add Text Caption**
   - Click "Add caption" button
   - Double-click the text to edit
   - Use the control panel to change font, size, and opacity

3. **Edit Elements**
   - Click any element to select it
   - Drag elements to reposition them
   - Use the control panel (bottom) to adjust properties
   - Delete elements with the delete button

4. **Audio Playback**
   - Click the play button on any audio element to hear it
   - Visualization animates in sync with audio

## Project Structure

```
noise-app/
├── public/
│   └── noise-logo.svg       # NOISE wordmark
├── src/
│   ├── components/
│   │   ├── AudioItem.jsx    # Audio element with visualization
│   │   ├── ControlPanel.jsx # Properties panel
│   │   ├── FontDropdown.jsx # Custom styled font selector
│   │   ├── NoiseOverlay.jsx # Top-layer NOISE wordmark
│   │   ├── Scene.jsx        # Canvas containing all items
│   │   └── TextItem.jsx     # Text caption element
│   ├── App.jsx              # Main app with state management
│   ├── index.css            # Tailwind + custom styles
│   └── main.jsx             # Entry point
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Requires support for:
- MediaRecorder API
- AudioContext/Web Audio API
- Canvas 2D

## Notes

- All data is stored in memory only - refreshing the page clears all elements
- No backend, authentication, or database required
- Works entirely offline after initial load (fonts may require internet)

## License

MIT
