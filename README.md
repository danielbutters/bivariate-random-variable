# 3D Coordinate System with Gridlines

A Three.js web application that displays a 3D coordinate system with x, y, and z axes, gridlines, and numbered tick marks.

## Features

- **3D Coordinate Axes**: Red (X-axis), Green (Y-axis), Blue (Z-axis)
- **Gridlines**: Three perpendicular grid planes (XY, YZ, XZ)
- **Tick Marks**: Small lines at each grid division
- **Numbered Labels**: Numbers displayed at regular intervals on each axis
- **Interactive Controls**: Mouse rotation and zoom functionality
- **Responsive Design**: Adapts to window resizing

## How to Run

1. Simply open `index.html` in a modern web browser
2. No server setup required - the app uses CDN links for Three.js

## Controls

- **Left Mouse Button + Drag**: Rotate the view around the coordinate system
- **Mouse Wheel**: Zoom in and out
- **Right Mouse Button + Drag**: Pan the view

## Technical Details

- Built with Three.js r128
- Uses OrbitControls for camera manipulation
- Canvas-based text rendering for axis labels
- Responsive design that adapts to window size
- Grid extends from -20 to +20 on each axis
- Numbers are displayed every 5 units for clarity

## File Structure

```
BivariateRandomVariableMk2/
├── index.html          # Main application file
└── README.md           # This file
```

## Browser Compatibility

This application works best in modern browsers that support WebGL:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Customization

You can modify the following parameters in the JavaScript code:
- `gridSize`: Extent of the coordinate system (default: 20)
- `gridDivisions`: Number of grid divisions (default: 20)
- `tickSize`: Size of tick marks (default: 0.5)
- Colors of axes, grids, and labels
- Label frequency and positioning
