const themeBtn = document.getElementById("theme-toggle");
let isDarkMode = false;

const style = document.createElement('style');
style.innerHTML = `
  .d3-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .highlighted {
    stroke-width: 4px !important;
    stroke: var(--accent) !important;
    opacity: 1 !important;
    z-index: 100;
  }
  .faded {
    opacity: 0.1 !important;
  }
`;
document.head.appendChild(style);

const tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode", isDarkMode);
    themeBtn.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
    
    if (state.countryData.length > 0) renderAllCharts();
  });
}

const state = {
  countryData: [],
  usStateData: [],
  years: [],
  usYears: []
};

const regionColor = d3.scaleOrdinal(d3.schemeTableau10);
const countryColor = d3.scaleOrdinal(d3.schemeTableau10);

Promise.all([
  d3.csv("data/ev_country_year.csv", d3.autoType),
  d3.csv("data/us_state_infra.csv", d3.autoType)
]).then(([countryData, usData]) => {
  
  countryData.forEach(d => {
    d.year = +d.year;
    d.ev_stock = +d.ev_stock || 0;
    d.ev_sales = +d.ev_sales || 0;
    d.market_share = +d.market_share || 0;
    d.co2_transport = +d.co2_transport || 0;
  });

  usData.forEach(d => {
    d.year = +d.year;
    d.chargers = +d.chargers || 0;
    d.ev_stock = +d.ev_stock || 0;
    d.market_share = +d.market_share || 0;
  });

  state.countryData = countryData;
  state.usStateData = usData;
  state.years = Array.from(new Set(countryData.map(d => d.year))).sort(d3.ascending);
  state.usYears = Array.from(new Set(usData.map(d => d.year))).sort(d3.ascending);

  initControls();
  renderAllCharts();

  window.addEventListener("resize", renderAllCharts);

}).catch(err => {
    console.error("Error loading data:", err);
    document.querySelector("main").innerHTML = `<h3 style="color:red; text-align:center;">Error loading data: ${err.message}</h3>`;
});

function renderAllCharts() {
    renderSalesBarChart();
    renderStockLineChart();
    renderMarketHeatmap();
    renderInfraScatter();
    renderPCP();
}

function initControls() {
    setupSlider("sales-year-slider", "sales-year-label", state.years, renderSalesBarChart);
    setupSlider("scatter-year-slider", "scatter-year-label", state.usYears, renderInfraScatter);
}

function setupSlider(id, labelId, yearArray, callback) {
    const slider = document.getElementById(id);
    const label = document.getElementById(labelId);
    if(!slider || !yearArray.length) return;

    const max = d3.max(yearArray);
    slider.min = d3.min(yearArray);
    slider.max = max;
    slider.value = max;
    if(label) label.textContent = max;

    slider.addEventListener("input", (e) => {
        if(label) label.textContent = e.target.value;
        callback();
    });
}

function showTooltip(event, htmlContent) {
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html(htmlContent)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}

function moveTooltip(event) {
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
    tooltip.transition().duration(500).style("opacity", 0);
}

function renderSalesBarChart() {
  const container = document.getElementById("sales-bar-chart")?.parentElement;
  if (!container) return;
  
  const svgId = "#sales-bar-chart";
  d3.select(svgId).selectAll("*").remove();

  const margin = { top: 30, right: 30, bottom: 90, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(svgId)
    .attr("viewBox", `0 0 ${container.clientWidth} 400`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const year = +document.getElementById("sales-year-slider").value;
  const yearData = state.countryData.filter(d => d.year === year);
  
  const salesByRegion = d3.rollups(yearData, v => d3.sum(v, d => d.ev_sales), d => d.region)
                          .sort((a,b) => b[1] - a[1]);

  const x = d3.scaleBand()
    .domain(salesByRegion.map(d => d[0]))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(salesByRegion, d => d[1]) || 100])
    .nice()
    .range([height, 0]);

  const bars = svg.selectAll("rect")
    .data(salesByRegion, d => d[0]);

  bars.enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("width", x.bandwidth())
    .attr("y", height)
    .attr("height", 0)
    .attr("fill", d => regionColor(d[0]))
    .attr("opacity", 0.9)
    .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 1).attr("stroke", "#333").attr("stroke-width", 2);
        showTooltip(event, `<strong>${d[0]}</strong><br/>Sales: ${d3.format(",")(d[1])}`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.9).attr("stroke", "none");
        hideTooltip();
    })
    .merge(bars)
    .transition() 
    .duration(750)
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1]));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("dy", "10px")
    .style("font-size", "11px");

  svg.append("g").call(d3.axisLeft(y).ticks(5, "s"));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .style("fill", "var(--text-muted)")
    .style("font-size", "13px")
    .text(`Annual EV sales (millions) grouped by region — ${year}`);
}

function renderStockLineChart() {
  const container = document.getElementById("stock-line-chart")?.parentElement;
  if (!container) return;

  const svgId = "#stock-line-chart";
  d3.select(svgId).selectAll("*").remove();

  const margin = { top: 30, right: 30, bottom: 90, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(svgId)
    .attr("viewBox", `0 0 ${container.clientWidth} 400`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(state.years))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(state.countryData, d => d.ev_stock) || 100])
    .nice().range([height, 0]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.ev_stock));

  const grouped = d3.group(state.countryData, d => d.country);

  const paths = svg.selectAll(".country-line")
    .data(grouped)
    .join("path")
    .attr("class", "country-line")
    .attr("fill", "none")
    .attr("stroke", d => countryColor(d[0]))
    .attr("stroke-width", 2)
    .attr("opacity", 0.6)
    .attr("d", d => line(d[1].sort((a,b) => a.year - b.year)));

  svg.selectAll(".hover-line")
    .data(grouped)
    .join("path")
    .attr("d", d => line(d[1].sort((a,b) => a.year - b.year)))
    .attr("fill", "none")
    .attr("stroke", "transparent")
    .attr("stroke-width", 15) 
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
        paths.filter(p => p[0] === d[0])
             .attr("stroke-width", 4)
             .attr("opacity", 1);
        
        paths.filter(p => p[0] !== d[0]).attr("opacity", 0.1);

        const lastPoint = d[1][d[1].length-1];
        showTooltip(event, `<strong>${d[0]}</strong><br/>Max Stock: ${d3.format(",")(lastPoint.ev_stock)}`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", function() {
        paths.attr("stroke-width", 2).attr("opacity", 0.6);
        hideTooltip();
    });

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g").call(d3.axisLeft(y).ticks(5, "s"));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .style("fill", "var(--text-muted)")
    .style("font-size", "13px")
    .text("Total EV Stock (hover to highlight country)");
}

function renderMarketHeatmap() {
  const container = document.getElementById("market-heatmap")?.parentElement;
  if (!container) return;

  const svgId = "#market-heatmap";
  d3.select(svgId).selectAll("*").remove();

  const margin = { top: 30, right: 20, bottom: 90, left: 100 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(svgId)
    .attr("viewBox", `0 0 ${container.clientWidth} 400`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const maxShare = d3.rollups(state.countryData, v => d3.max(v, d => d.market_share), d => d.country)
                     .sort((a,b) => b[1] - a[1])
                     .slice(0, 25).map(d => d[0]);
  
  const data = state.countryData.filter(d => maxShare.includes(d.country));

  const x = d3.scaleBand().domain(state.years).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(maxShare).range([0, height]).padding(0.05);
  const color = d3.scaleSequential(d3.interpolateInferno).domain([0, 80]);

  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.country))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.market_share))
    .attr("rx", 2)
    .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 2);
        showTooltip(event, `<strong>${d.country} (${d.year})</strong><br/>Share: ${d.market_share.toFixed(1)}%`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("stroke", "none");
        hideTooltip();
    });

  svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickValues(state.years.filter((y, i) => i % 2 === 0))).select(".domain").remove();
  svg.append("g").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .style("fill", "var(--text-muted)")
    .style("font-size", "13px")
    .text("EV Market Share (%) — Darker is Higher");
}

function renderInfraScatter() {
  const container = document.getElementById("infra-scatter-chart")?.parentElement;
  if (!container) return;

  const svgId = "#infra-scatter-chart";
  d3.select(svgId).selectAll("*").remove();

  const margin = { top: 30, right: 30, bottom: 90, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(svgId)
    .attr("viewBox", `0 0 ${container.clientWidth} 400`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const year = +document.getElementById("scatter-year-slider").value;
  const data = state.usStateData.filter(d => d.year === year);

  if (!data.length) {
      svg.append("text").attr("x", width/2).attr("y", height/2).text("No Data");
      return;
  }

  const x = d3.scaleLinear().domain([0, d3.max(state.usStateData, d => d.chargers)||1000]).nice().range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(state.usStateData, d => d.ev_stock)||1000]).nice().range([height, 0]);
  const r = d3.scaleSqrt().domain([0, 20]).range([4, 25]);

  const circles = svg.selectAll("circle").data(data, d => d.state);

  circles.enter()
    .append("circle")
    .attr("cx", d => x(d.chargers))
    .attr("cy", d => y(d.ev_stock))
    .attr("r", 0) 
    .attr("fill", "var(--accent)")
    .attr("opacity", 0.7)
    .attr("stroke", "#fff")
    .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("fill", "#fff").attr("stroke", "var(--accent)").attr("stroke-width", 2).attr("opacity", 1);
        showTooltip(event, `<strong>${d.state}</strong><br/>Stock: ${d3.format(",")(d.ev_stock)}<br/>Chargers: ${d3.format(",")(d.chargers)}<br/>Share: ${d.market_share}%`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("fill", "var(--accent)").attr("stroke", "#fff").attr("opacity", 0.7);
        hideTooltip();
    })
    .merge(circles)
    .transition().duration(750)
    .attr("cx", d => x(d.chargers))
    .attr("cy", d => y(d.ev_stock))
    .attr("r", d => r(d.market_share));

  circles.exit().transition().duration(500).attr("r", 0).remove();

  svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5, "s"));
  svg.append("g").call(d3.axisLeft(y).ticks(5, "s"));
  
  // Labels
  svg.append("text").attr("x", width).attr("y", height + 35).attr("text-anchor", "end").style("fill", "var(--text-muted)").style("font-size", "11px").text("Chargers ->");
  svg.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -height/2).attr("text-anchor", "middle").style("fill", "var(--text-muted)").style("font-size", "11px").text("EV Stock");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 70)
    .attr("text-anchor", "middle")
    .style("fill", "var(--text-muted)")
    .style("font-size", "13px")
    .text(`US States: Bubble Size = Market Share % (${year})`);
}

function renderPCP() {
  const container = document.getElementById("pcp-chart")?.parentElement;
  if (!container) return;

  const svgId = "#pcp-chart";
  d3.select(svgId).selectAll("*").remove();

  const margin = { top: 40, right: 10, bottom: 80, left: 10 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(svgId)
    .attr("viewBox", `0 0 ${container.clientWidth} 400`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const latestYear = d3.max(state.years);
  const data = state.countryData.filter(d => d.year === latestYear);
  const dimensions = ["ev_stock", "ev_sales", "market_share", "co2_transport"];
  const labels = { ev_stock: "Stock", ev_sales: "Sales", market_share: "Share %", co2_transport: "CO2" };

  const y = {};
  dimensions.forEach(dim => {
      y[dim] = d3.scaleLinear()
        .domain(d3.extent(state.countryData, d => d[dim]))
        .range([height, 0]);
  });

// ---- Improved Reset filters button behavior (fires slider input events) ---- //
(function() {
  try {
    const resetBtn = document.getElementById('reset-pcp');
    console.log('[RESET] init: resetBtn=', resetBtn);
    if (!resetBtn) {
      console.warn('[RESET] Button not found (#reset-pcp).');
      return;
    }

    function triggerInput(el) {
      if (!el) return;
      // update label if present
      const labelId = el.id === 'sales-year-slider' ? 'sales-year-label' :
                      el.id === 'scatter-year-slider' ? 'scatter-year-label' : null;
      if (labelId) {
        const lbl = document.getElementById(labelId);
        if (lbl) lbl.textContent = el.value;
      }
      // dispatch an input event so existing listeners run
      const evt = new Event('input', { bubbles: true, cancelable: true });
      el.dispatchEvent(evt);
    }

    function resetFilters() {
      console.log('[RESET] resetFilters() called');

      // 1) Reset sliders to max & trigger their input handlers
      try {
        if (state.years && state.years.length) {
          const maxYear = d3.max(state.years);
          const salesSlider = document.getElementById('sales-year-slider');
          if (salesSlider) {
            salesSlider.value = maxYear;
            // update label & fire input to run its callback
            triggerInput(salesSlider);
          } else {
            console.warn('[RESET] sales slider not found');
          }
        } else {
          console.warn('[RESET] state.years empty');
        }

        if (state.usYears && state.usYears.length) {
          const maxUSYear = d3.max(state.usYears);
          const scatterSlider = document.getElementById('scatter-year-slider');
          if (scatterSlider) {
            scatterSlider.value = maxUSYear;
            triggerInput(scatterSlider);
          } else {
            console.warn('[RESET] scatter slider not found');
          }
        } else {
          console.warn('[RESET] state.usYears empty');
        }
      } catch (e) {
        console.warn('[RESET] slider reset error', e);
      }

      // 2) Remove any visual selection/highlight classes and inline styles
      try {
        document.querySelectorAll('.highlighted, .faded').forEach(el => {
          el.classList.remove('highlighted', 'faded');
        });
        document.querySelectorAll('svg .country-line, svg circle, svg path').forEach(el => {
          el.style.opacity = '';
          el.style.strokeWidth = '';
          el.style.stroke = '';
          el.style.fill = '';
        });
      } catch (e) { console.warn('[RESET] clearing styles error', e); }

      // 3) Clear tooltip
      try { if (typeof tooltip !== 'undefined') tooltip.style('opacity', 0).html(''); } catch (e) { console.warn('[RESET] tooltip clear error', e); }

      // 4) Re-render charts as a safety (some charts update via their own slider callbacks)
      try { renderAllCharts(); } catch (e) { console.error('[RESET] renderAllCharts error', e); }

      console.log('[RESET] done');
    }

    // attach listener and also expose debug command
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetFilters();
    });
    window.__resetFilters = resetFilters;
    console.log('[RESET] handler attached and __resetFilters available in console');
  } catch (err) {
    console.error('[RESET] initialization failed', err);
  }
})();


  const x = d3.scalePoint().domain(dimensions).range([0, width]).padding(0.5);
  const line = d3.line().defined(d => !isNaN(d[1])).x(d => x(d[0])).y(d => y[d[0]](d[1]));

  const paths = svg.selectAll("path")
    .data(data)
    .join("path")
    .attr("d", d => line(dimensions.map(p => [p, d[p]])))
    .style("fill", "none")
    .style("stroke", d => countryColor(d.country))
    .style("opacity", 0.4)
    .style("stroke-width", 1.5);

  svg.selectAll(".hover-path")
    .data(data)
    .join("path")
    .attr("d", d => line(dimensions.map(p => [p, d[p]])))
    .style("fill", "none")
    .style("stroke", "transparent")
    .style("stroke-width", 15)
    .style("cursor", "crosshair")
    .on("mouseover", function(event, d) {
        paths.filter(p => p.country === d.country)
             .classed("highlighted", true)
             .raise(); // Bring to front
        
        paths.filter(p => p.country !== d.country)
             .classed("faded", true);

        showTooltip(event, `<strong>${d.country}</strong><br/>Share: ${d.market_share}%<br/>CO2: ${d.co2_transport}`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", function() {
        paths.classed("highlighted", false).classed("faded", false);
        hideTooltip();
    });

  svg.selectAll(".axis")
    .data(dimensions).enter()
    .append("g")
    .attr("transform", d => `translate(${x(d)})`)
    .each(function(d) { d3.select(this).call(d3.axisLeft(y[d]).ticks(5)); })
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -15)
    .text(d => labels[d])
    .style("fill", "var(--accent)")
    .style("font-weight", "bold");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .style("fill", "var(--text-muted)")
    .style("font-size", "13px")
    .text("Hover over lines to isolate countries.");
}
// ==== Smooth offset scrolling + active link highlighting for .top-nav anchors ==== //
(function() {
  // Select anchors inside your top nav
  const navLinks = document.querySelectorAll('.top-nav a[href^="#"]');
  if (!navLinks || navLinks.length === 0) return;

  // Header selector from your HTML
  const headerEl = document.querySelector('.site-header');
  function headerHeight() {
    // compute current header height (accounts for responsive changes)
    return headerEl ? headerEl.getBoundingClientRect().height : 0;
  }

  // Scroll to target with header offset and small padding
  function scrollToTarget(hash) {
    if (!hash) return;
    const id = hash.replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;

    // compute top position with offset
    const rect = target.getBoundingClientRect();
    const offset = headerHeight() + 12; // 12px extra padding
    const top = window.pageYOffset + rect.top - offset;

    window.scrollTo({
      top: Math.max(0, Math.floor(top)),
      behavior: 'smooth'
    });

    // update url hash without immediate jump
    history.pushState(null, '', '#' + id);
  }

  // Click handler for nav links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        scrollToTarget(href);
      }
    });
  });

  // --- Active link highlighting on scroll ---
  // Build map of section top positions for a fast check
  const sections = Array.from(navLinks)
    .map(a => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  function getCurrentSectionIndex() {
    const offset = headerHeight() + 20; // slightly larger threshold
    const pos = window.pageYOffset + offset;
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (s.offsetTop <= pos) return i;
    }
    return 0;
  }

  // Debounced scroll handler
  let scrollTimer = null;
  function onScroll() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = getCurrentSectionIndex();
      navLinks.forEach((link, i) => {
        if (i === idx) link.classList.add('active');
        else link.classList.remove('active');
      });
    }, 100);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // If page opened with a hash, scroll to it after small delay (header stable)
  if (window.location.hash) {
    setTimeout(() => scrollToTarget(window.location.hash), 120);
  }

  // Trigger initial active link update
  onScroll();
})();
