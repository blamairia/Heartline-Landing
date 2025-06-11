/**
 * Part 2: Waveform Rendering & Edit-Mode Protection
 */

// Display ECG waveform (called from Part 1)
function displayECGWaveform(ecgData) {
  protectECGSectionVisibility();
  console.log('Displaying ECG waveform:', ecgData);

  const loadingEl = document.getElementById('ecg-waveform-loading');
  const errorEl   = document.getElementById('ecg-waveform-error');
  const canvas    = document.getElementById('ecg-waveform-chart');

  if (!canvas) {
    console.error('ECG waveform canvas not found');
    showWaveformError('Waveform canvas not available');
    return;
  }

  // Keep everything visible
  if (loadingEl) loadingEl.style.display = 'none';
  if (errorEl)   errorEl.style.display   = 'none';

  // Store data and render
  currentECGData = ecgData;
  createLeadControls(ecgData.signals.length);
  updateECGChart();
}

/**
 * Build the lead-selection controls
 */
function createLeadControls(numberOfLeads) {
  protectECGSectionVisibility();
  const container = document.getElementById('ecg-controls');
  if (!container) return;

  let html = `
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row align-items-center">
          <div class="col-md-4">
            <label for="lead-selector"><strong>Select ECG Lead:</strong></label>
            <select id="lead-selector" class="form-control form-control-sm">
  `;

  for (let i = 0; i < numberOfLeads && i < ECG_LEADS.length; i++) {
    html += `<option value="${i}"${i===currentLead?' selected':''}>${ECG_LEADS[i]}</option>`;
  }

  html += `
            </select>
          </div>
          <div class="col-md-4 text-muted small">
            <i class="fas fa-ruler"></i> 25mm/s | 10mm/mV
          </div>
          <div class="col-md-4 text-muted small">
            <i class="fas fa-th"></i> 1 small box = 40ms × 0.1mV
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  const selector = document.getElementById('lead-selector');
  if (selector) {
    selector.addEventListener('change', e => {
      currentLead = parseInt(e.target.value, 10);
      updateECGChart();
    });
  }
}

/**
 * Draw the ECG waveform onto the canvas
 */
function updateECGChart() {
  protectECGSectionVisibility();
  if (!currentECGData) {
    console.warn('No ECG data to render');
    return;
  }

  const canvas = document.getElementById('ecg-waveform-chart');
  const ctx    = canvas.getContext('2d');

  // Margins for axes & labels
  const MARGIN_LEFT   = 80;
  const MARGIN_RIGHT  = 40;
  const MARGIN_TOP    = 60;
  const MARGIN_BOTTOM = 80;

  // Plot area
  const plotWidth  = 1000;
  const plotHeight = 600;

  // Resize canvas
  const width  = plotWidth + MARGIN_LEFT + MARGIN_RIGHT;
  const height = plotHeight + MARGIN_TOP + MARGIN_BOTTOM;
  canvas.width  = width;
  canvas.height = height;
  canvas.style.width  = width + 'px';
  canvas.style.height = height + 'px';

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  // ECG paper area
  ctx.fillStyle = '#FFF8DC';
  ctx.fillRect(MARGIN_LEFT, MARGIN_TOP, plotWidth, plotHeight);

  // Draw grid & axes
  drawECGGrid(ctx, plotWidth, plotHeight, MARGIN_LEFT, MARGIN_TOP);

  const tData = currentECGData.time;
  const sData = currentECGData.signals[currentLead];

  const tMin = Math.min(...tData);
  const tMax = Math.max(...tData);
  const vMin = Math.min(...sData);
  const vMax = Math.max(...sData);

  const tPad = (tMax - tMin) * 0.05;
  const vPad = Math.max((vMax - vMin) * 0.1, 0.5);

  const tStart = tMin - tPad;
  const tEnd   = tMax + tPad;
  const vStart = vMin - vPad;
  const vEnd   = vMax + vPad;

  const tRange = tEnd - tStart;
  const vRange = vEnd - vStart;

  drawAxes(ctx,
    MARGIN_LEFT, MARGIN_TOP,
    plotWidth, plotHeight,
    tStart, tEnd, vStart, vEnd
  );

  // Lead label
  ctx.fillStyle = '#000';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(ECG_LEADS[currentLead], width/2, 30);

  // Plot waveform
  ctx.beginPath();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  let first = true;
  for (let i = 0; i < tData.length; i++) {
    const t = tData[i], v = sData[i];
    const x = MARGIN_LEFT + ((t - tStart) / tRange) * plotWidth;
    const y = MARGIN_TOP + plotHeight - ((v - vStart) / vRange) * plotHeight;

    if (first) {
      ctx.moveTo(x,y);
      first = false;
    } else {
      ctx.lineTo(x,y);
    }
  }
  ctx.stroke();

  // Interactivity
  addCanvasInteractivity(
    canvas, tStart, vStart, tRange, vRange,
    MARGIN_LEFT, MARGIN_TOP, plotWidth, plotHeight
  );

  console.log(`Waveform for ${ECG_LEADS[currentLead]} rendered`);
}

/**
 * Draw the small & large ECG grid
 */
function drawECGGrid(ctx, w, h, ox, oy) {
  const SMALL = 4;  // 1 mm
  const LARGE = 20; // 5 mm

  ctx.save();
  ctx.translate(ox, oy);

  // Small lines
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += SMALL) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += SMALL) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }

  // Large lines
  ctx.strokeStyle = '#FF6B35';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += LARGE) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += LARGE) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw axes with ticks & labels
 */
function drawAxes(ctx, ml, mt, pw, ph, t0, t1, v0, v1) {
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  // Axes
  ctx.beginPath();
  ctx.moveTo(ml, mt);
  ctx.lineTo(ml, mt+ph);
  ctx.moveTo(ml, mt+ph);
  ctx.lineTo(ml+pw, mt+ph);
  ctx.stroke();

  // Time (x-axis)
  ctx.font = '12px Arial'; ctx.textAlign = 'center';
  for (let i=0; i<=10; i++) {
    const x = ml + (i*(pw/10));
    const t = t0 + i*((t1-t0)/10);
    ctx.beginPath();
    ctx.moveTo(x, mt+ph);
    ctx.lineTo(x, mt+ph+5);
    ctx.stroke();
    ctx.fillText(t.toFixed(2)+'s', x, mt+ph+20);
  }
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Time (s)', ml+pw/2, mt+ph+50);

  // Voltage (y-axis)
  ctx.textAlign = 'right'; ctx.font = '12px Arial';
  for (let i=0; i<=10; i++) {
    const y = mt + ph - (i*(ph/10));
    const v = v0 + i*((v1-v0)/10);
    ctx.beginPath();
    ctx.moveTo(ml-5, y);
    ctx.lineTo(ml, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(1)+'mV', ml-10, y+4);
  }
  ctx.save();
  ctx.translate(20, mt + ph/2);
  ctx.rotate(-Math.PI/2);
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Amplitude (mV)',0,0);
  ctx.restore();
}

/**
 * Show time/voltage tooltip on hover
 */
function addCanvasInteractivity(canvas, t0, v0, tRange, vRange, ml, mt, pw, ph) {
  const tip = document.createElement('div');
  tip.style.position = 'absolute';
  tip.style.background = 'rgba(0,0,0,0.8)';
  tip.style.color = 'white';
  tip.style.padding = '4px 6px';
  tip.style.borderRadius = '4px';
  tip.style.fontSize = '12px';
  tip.style.pointerEvents = 'none';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x<ml||x>ml+pw||y<mt||y>mt+ph) {
      tip.style.display='none';
      return;
    }
    const time    = t0 + ((x-ml)/pw)*tRange;
    const voltage = v0 + ((mt+ph-y)/ph)*vRange;
    tip.innerHTML = `
      <div><strong>Time:</strong> ${time.toFixed(4)}s</div>
      <div><strong>${ECG_LEADS[currentLead]}:</strong> ${voltage.toFixed(3)}mV</div>
    `;
    tip.style.left = (e.clientX+10)+'px';
    tip.style.top  = (e.clientY-10)+'px';
    tip.style.display = 'block';
  });

  canvas.addEventListener('mouseleave', () => {
    tip.style.display = 'none';
  });
}

/**
 * Show an error in the waveform card
 */
function showWaveformError(message) {
  protectECGSectionVisibility();
  const loadEl = document.getElementById('ecg-waveform-loading');
  const errEl  = document.getElementById('ecg-waveform-error');
  if (loadEl) loadEl.style.display = 'none';
  if (errEl) {
    errEl.style.display = 'block';
    const p = errEl.querySelector('p');
    if (p) p.textContent = message;
  }
  if (ecgChart) {
    ecgChart.destroy();
    ecgChart = null;
  }
}

/**
 * Edit-mode protection: never let the ECG panel hide
 */
function protectECGSectionVisibility() {
  if (!window.location.pathname.includes('/edit')) return;
  forceECGVisibility();
}

function setupECGSectionProtection() {
  if (!window.location.pathname.includes('/edit')) return;
  forceECGVisibility();

  const targets = [
    '#ecg-analysis-section',
    '#ecg-waveform-container'
  ];
  const banner  = document.querySelector('#ecg-analysis-section > .alert.alert-info');

  const cb = (mutations) => {
    let changed = false;
    for (const m of mutations) {
      if (m.type==='attributes' && m.attributeName==='style') changed = true;
      if (m.type==='childList' && m.target.classList?.contains('d-none')) changed = true;
    }
    if (changed) forceECGVisibility();
  };

  const cfg = { attributes:true, childList:true, subtree:true, attributeOldValue:true };
  targets.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) new MutationObserver(cb).observe(el, cfg);
  });
  if (banner) new MutationObserver(cb).observe(banner, {attributes:true, attributeOldValue:true});

  setInterval(forceECGVisibility, 250);
}

function forceECGVisibility() {
  if (!window.location.pathname.includes('/edit')) return;
  [
    '#ecg-analysis-section',
    '#ecg-waveform-container',
    '#ecg-analysis-results',
    '#ecg-controls',
    '#ecg-waveform-chart',
    '#ecg-analysis-section > .alert.alert-info',
    '#ecg-analysis-loading',
    '#ecg-waveform-loading',
    '#ecg-waveform-error'
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      el.style.setProperty('display',    'block', 'important');
      el.style.setProperty('visibility','visible','important');
      el.style.setProperty('opacity',   '1',     'important');
      el.classList.remove('d-none');
    }
  });
}
