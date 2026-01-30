# The Electric Vehicle Revolution
An Interactive Data Visualization of Global EV Adoption

## Overview
This project is an interactive, narrative-driven data visualization that explores the global adoption of electric vehicles (EVs) over time. Using real-world datasets, the application examines EV growth through multiple analytical lenses including sales volume, cumulative stock, market share, infrastructure availability, and multivariate country-level comparisons.

The goal of the project is to combine data analysis, visual storytelling, and interactive design to help users understand how and where electric vehicles are being adopted worldwide, and what factors enable or constrain that growth.

--

## Live Demo
If deployed, add the link here:

--

## Key Features
- Interactive, scroll-based narrative with clearly defined analytical chapters
- Dynamic charts built using D3.js with responsive resizing
- Global sales analysis with year-based filtering
- Time-series visualization of cumulative EV stock by country
- Heatmap showing market share adoption trends across countries
- U.S.-focused infrastructure analysis comparing chargers and EV stock
- Parallel Coordinates Plot for multivariate country-level comparison
- Dark and light mode toggle for accessibility
- Reset Filter functionality to restore all visualizations to their default state

--

## Application Structure
The visualization is organized into five sequential chapters:

1. Introduction  
   Context-setting narrative describing the global EV transition and analytical framing.

2. Global Sales Volume  
   Bar chart showing annual EV sales aggregated by region, with a year slider to observe growth trends.

3. Accumulation on the Road (Stock)  
   Line chart illustrating cumulative EV stock over time by country, highlighting long-term adoption trajectories.

4. Adoption Rates (Market Share Heatmap)  
   Heatmap visualizing the percentage of new vehicle sales that are electric, emphasizing intensity of adoption across countries and years.

5. Infrastructure and Global Profiles  
   - Scatter plot analyzing the relationship between EV stock and charging infrastructure across U.S. states  
   - Parallel Coordinates Plot enabling multivariate comparison of countries across EV stock, sales, market share, and transport-related CO₂ emissions

--

## Technologies Used
- JavaScript (ES6)
- D3.js v7
- HTML5 and CSS3
- VS Code Live Server

--

## Data Sources
The project uses publicly available datasets compiled and cleaned for visualization purposes:

- International Energy Agency (IEA) Global EV Data Explorer
- U.S. Department of Energy Alternative Fuels Data Center (AFDC)
- Our World in Data (transport-related CO₂ emissions)

Processed CSV files are stored locally and loaded dynamically by the application.

--

## How to Run Locally
1. Clone the repository
2. Open the project folder in VS Code.
3. Run the application using Live Server:
- Right-click `index.html`
- Select "Open with Live Server"
4. The visualization will open in your browser.

--

## Recent Improvements
- Implemented smooth, header-aware navigation that correctly scrolls to each section and highlights the active chapter.
- Added a functional Reset Filter control that restores all visualizations to their default state by resetting sliders, clearing highlights, and re-rendering charts while preserving user preferences such as theme mode.

--

## Learning Outcomes
- Designed and implemented complex interactive visualizations using D3.js
- Managed shared application state across multiple coordinated views
- Applied principles of visual storytelling and narrative flow
- Handled responsive layouts and browser resize behavior
- Built user-friendly controls for filtering and resetting data-driven interactions

--

## Team
- Mrudula Eluri
- Vaishnavi Bhairishetty 

--

## Notes for Reviewers
This project emphasizes clarity, interaction design, and analytical reasoning over raw model performance. It is intended to demonstrate skills in data visualization, front-end data handling, and effective communication of insights through interactive graphics.
