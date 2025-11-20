const audio = document.getElementById("mp-audio");
const playBtn = document.getElementById("mp-play");
const seekBar = document.getElementById("mp-seek");

const fpPlayBtn = document.getElementById("fp-play");
const fpSeekBar = document.getElementById("fp-seek");


// MINI PLAYER PLAY/PAUSE
playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = "⏸";
        fpPlayBtn.textContent = "⏸"; // sync
    } else {
        audio.pause();
        playBtn.textContent = "▶";
        fpPlayBtn.textContent = "▶"; // sync
    }
});


// FULL PLAYER PLAY/PAUSE
fpPlayBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = "⏸";
        fpPlayBtn.textContent = "⏸";
    } else {
        audio.pause();
        playBtn.textContent = "▶";
        fpPlayBtn.textContent = "▶";
    }
});


// UPDATE BOTH SEEKBARS
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        fpSeekBar.value = seekBar.value; // sync
    }
});


// MINI SEEKBAR CONTROL
seekBar.addEventListener("input", () => {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
    fpSeekBar.value = seekBar.value; // sync
});


// FULL SEEKBAR CONTROL
fpSeekBar.addEventListener("input", () => {
    audio.currentTime = (fpSeekBar.value / 100) * audio.duration;
    seekBar.value = fpSeekBar.value; // sync
});


// MINI → FULL EXPAND
document.querySelector(".mini-player").addEventListener("click", () => {
    document.getElementById("full-player").classList.add("show");
});

// CLOSE BIG PLAYER
document.getElementById("fp-close").addEventListener("click", () => {
    document.getElementById("full-player").classList.remove("show");
});

const mpCover = document.querySelector(".mp-cover");
const fpCover = document.querySelector(".fp-cover");

function updateRotation() {
    if (audio.paused) {
        mpCover.classList.remove("rotate");
        fpCover.classList.remove("rotate");
    } else {
        mpCover.classList.add("rotate");
        fpCover.classList.add("rotate");
    }
}

// update when play/pause
audio.addEventListener("play", updateRotation);
audio.addEventListener("pause", updateRotation);


const miniVis = document.querySelector(".mp-visualizer");
const fullVis = document.querySelector(".fp-visualizer");

function updateVisualizer() {
    if (audio.paused) {
        miniVis.classList.remove("playing");
        fullVis.classList.remove("playing");
    } else {
        miniVis.classList.add("playing");
        fullVis.classList.add("playing");
    }
}

audio.addEventListener("play", updateVisualizer);
audio.addEventListener("pause", updateVisualizer);

const volMini = document.getElementById("mp-volume");
const volFull = document.getElementById("fp-volume");

// Mini player controls volume
if (volMini) {
    volMini.addEventListener("input", () => {
        audio.volume = volMini.value / 100;
        if (volFull) volFull.value = volMini.value;
    });
}

// Full player controls volume
if (volFull) {
    volFull.addEventListener("input", () => {
        audio.volume = volFull.value / 100;
        volMini.value = volFull.value;
    });
}

/* -------------------------
   1) Dynamic background from album art
   -------------------------*/

// utility: compute average color of an image (samples to reduce work)
function computeAverageRGB(img, sampleCount = 30) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = img.naturalWidth || img.width;
  const h = canvas.height = img.naturalHeight || img.height;

  // downscale if huge
  const maxSide = 300;
  let sw = w, sh = h;
  if (Math.max(w, h) > maxSide) {
    const scale = maxSide / Math.max(w, h);
    sw = Math.round(w * scale);
    sh = Math.round(h * scale);
  }
  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(img, 0, 0, sw, sh);

  // sample pixels across canvas
  const stepX = Math.max(1, Math.floor(sw / Math.sqrt(sampleCount)));
  const stepY = Math.max(1, Math.floor(sh / Math.sqrt(sampleCount)));
  let r = 0, g = 0, b = 0, count = 0;
  const data = ctx.getImageData(0, 0, sw, sh).data;
  for (let y = 0; y < sh; y += stepY) {
    for (let x = 0; x < sw; x += stepX) {
      const idx = (y * sw + x) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) continue;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  if (count === 0) return { r: 0, g: 0, b: 0 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

// convert rgb to nice rgba strings for gradient & glow
function colorToRGBA(rgb, a = 1) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

// apply dynamic background to full-player and subtle glow to mini-player
function applyDynamicBackgroundFromImage(imgEl) {
  if (!imgEl) return;
  // if image not loaded yet, wait for it
  if (!imgEl.complete) {
    imgEl.addEventListener('load', () => applyDynamicBackgroundFromImage(imgEl), { once: true });
    return;
  }
  const avg = computeAverageRGB(imgEl, 40);
  // make two tones for a pleasing gradient
  const top = colorToRGBA(avg, 0.95);
  // darkened second tone
  const darker = colorToRGBA({ r: Math.max(0, avg.r - 40), g: Math.max(0, avg.g - 40), b: Math.max(0, avg.b - 40) }, 0.85);

  const full = document.getElementById('full-player');
  // apply gradient background (use cover image subtly layered)
  const coverUrl = (imgEl.src) ? `url("${imgEl.src}")` : 'none';
  full.style.backgroundImage = `linear-gradient(135deg, ${top}, ${darker}), ${coverUrl}`;
  full.classList.add('dynamic-bg');

  // set CSS variable to use in mini-player glow
  const mini = document.querySelector('.mini-player');
  const glowColor = `rgba(${avg.r}, ${avg.g}, ${avg.b}, 0.25)`;
  if (mini) {
    mini.style.setProperty('--mp-glow', glowColor);
    mini.classList.add('glow');
  }
}

/* call on page load and when cover changes */
(function initDynamicBg() {
  const mpCover = document.querySelector('.mp-cover');
  const fpCover = document.querySelector('.fp-cover');

  // prefer full-player cover if present and loaded
  const sourceImg = fpCover || mpCover;
  if (sourceImg) applyDynamicBackgroundFromImage(sourceImg);

  // if covers change (e.g., when switching songs), reapply
  // (you may call applyDynamicBackgroundFromImage when you set new src elsewhere)
  // add listeners for changes:
  [mpCover, fpCover].forEach(img => {
    if (!img) return;
    img.addEventListener('load', () => applyDynamicBackgroundFromImage(img));
    // also observe attribute changes to src (for dynamic song change)
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'src') {
          applyDynamicBackgroundFromImage(img);
        }
      }
    });
    obs.observe(img, { attributes: true });
  });
})();

/* -------------------------
   2) Animated SVG play/pause (lightweight Lottie-like)
   -------------------------*/

// inject SVG markup into the existing buttons (no HTML edits needed)
function makeAnimatedPlayButtons() {
  const svgMarkup = `
  <svg class="play-svg" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- triangle (play) -->
    <polygon class="triangle" points="18,12 48,30 18,48"></polygon>
    <!-- two bars (pause) -->
    <rect class="bar" x="20" y="14" width="6" height="32" rx="2"></rect>
    <rect class="bar" x="34" y="14" width="6" height="32" rx="2"></rect>
  </svg>
  `;
  const mpBtn = document.getElementById('mp-play');
  const fpBtn = document.getElementById('fp-play');

  if (mpBtn) mpBtn.innerHTML = svgMarkup;
  if (fpBtn) fpBtn.innerHTML = svgMarkup;
}
makeAnimatedPlayButtons();

// helper to toggle 'playing' class on parent button (so svg CSS animates)
function setPlayStateVisual(isPlaying) {
  const mpBtn = document.getElementById('mp-play');
  const fpBtn = document.getElementById('fp-play');
  if (mpBtn) {
    if (isPlaying) mpBtn.classList.add('playing'); else mpBtn.classList.remove('playing');
  }
  if (fpBtn) {
    if (isPlaying) fpBtn.classList.add('playing'); else fpBtn.classList.remove('playing');
  }
}

// wire to your audio events (don't redeclare audio)
if (typeof audio !== 'undefined') {
  // update visuals when play/pause happens
  audio.addEventListener('play', () => setPlayStateVisual(true));
  audio.addEventListener('pause', () => setPlayStateVisual(false));
  // when metadata loads (cover might be available), recompute bg
  audio.addEventListener('loadedmetadata', () => {
    const fpCover = document.querySelector('.fp-cover');
    const mpCover = document.querySelector('.mp-cover');
    const srcImg = fpCover || mpCover;
    if (srcImg) applyDynamicBackgroundFromImage(srcImg);
  });
}

// also toggle visual state when user clicks existing buttons (keeps sync)
document.getElementById('mp-play')?.addEventListener('click', () => {
  // small delay to allow audio state to change
  setTimeout(() => setPlayStateVisual(!audio.paused), 80);
});
document.getElementById('fp-play')?.addEventListener('click', () => {
  setTimeout(() => setPlayStateVisual(!audio.paused), 80);
});

/* Optional: if you programmatically change mp-cover or fp-cover src in playlist logic,
   call applyDynamicBackgroundFromImage(newImageElement) afterwards to update immediately. */
