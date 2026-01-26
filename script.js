// ===== DARK MODE FEATURE =====
// Initialize theme from localStorage or system preference
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.textContent = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        themeIcon.textContent = '🌙';
    }
}

// Theme toggle button functionality
document.getElementById('theme-toggle').addEventListener('click', () => {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (body.classList.contains('light-mode')) {
        // Switch to dark mode
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        themeIcon.textContent = '🌙';
    } else {
        // Switch to light mode
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        themeIcon.textContent = '☀️';
    }
});

// Initialize theme on page load
initializeTheme();

// ===== END DARK MODE FEATURE =====

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


// MINI → FULL EXPAND (but ignore buttons and sliders)
document.getElementById("mini-player").addEventListener("click", (e) => {
    if (
        e.target.tagName !== "BUTTON" &&
        e.target.tagName !== "INPUT" &&
        !e.target.classList.contains("mp-cover")
    ) {
        document.getElementById("full-player").style.display = "flex";
    }
});


// CLOSE BIG PLAYER
document.getElementById("fp-close").addEventListener("click", () => {
    document.getElementById("full-player").style.display = "none";
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

   // CLICK → OPEN FULL PLAYER
document.getElementById("float-bubble").addEventListener("click", () => {
    document.getElementById("full-player").style.display = "flex";
});


// MAKE THE BUBBLE DRAGGABLE
const bubble = document.getElementById("float-bubble");
let isDragging = false;
let offsetX, offsetY;

bubble.addEventListener("mousedown", (e) => {
    isDragging = true;

    offsetX = e.clientX - bubble.getBoundingClientRect().left;
    offsetY = e.clientY - bubble.getBoundingClientRect().top;
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    bubble.style.left = `${e.clientX - offsetX}px`;
    bubble.style.top = `${e.clientY - offsetY}px`;
    bubble.style.bottom = "auto";  // so top works
    bubble.style.right = "auto";
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});


document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;

    const rect = bubble.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const snapMargin = 40;

    let finalX = rect.left;
    let finalY = rect.top;

    // Snap left / right
    if (rect.left < snapMargin) {
        finalX = 10;
    } else if (screenWidth - rect.right < snapMargin) {
        finalX = screenWidth - rect.width - 10;
    }

    // Snap top / bottom
    if (rect.top < snapMargin) {
        finalY = 10;
    } else if (screenHeight - rect.bottom < snapMargin) {
        finalY = screenHeight - rect.height - 10;
    }

    bubble.style.transition = "0.25s ease";
    bubble.style.left = `${finalX}px`;
    bubble.style.top = `${finalY}px`;

    setTimeout(() => {
        bubble.style.transition = "";
    }, 250);
});

// ===== PARTICLE BACKGROUND ANIMATION =====
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 80;
        
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                color: this.getRandomColor()
            });
        }
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Pulse effect when music is playing
            if (!audio.paused) {
                particle.opacity = 0.3 + Math.sin(Date.now() * 0.003 + particle.x * 0.01) * 0.2;
            }
        });
    }
    
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw connections between nearby particles
        this.drawConnections();
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (100 - distance) / 100 * 0.2;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }
    
    animate() {
        this.updateParticles();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
}

// ===== SOUND WAVE VISUALIZATION =====
class SoundWaveVisualizer {
    constructor() {
        this.canvas = document.getElementById('sound-wave-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bars = 64;
        this.barWidth = 0;
        this.barHeights = new Array(this.bars).fill(0);
        
        this.resize();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.barWidth = this.canvas.width / this.bars;
    }
    
    generateRandomData() {
        // Simulate audio data when no real audio analysis is available
        for (let i = 0; i < this.bars; i++) {
            if (!audio.paused) {
                // More dynamic when playing
                const target = Math.random() * this.canvas.height * 0.8;
                this.barHeights[i] += (target - this.barHeights[i]) * 0.1;
            } else {
                // Gentle idle animation when paused
                const target = Math.sin(Date.now() * 0.002 + i * 0.1) * 20 + 30;
                this.barHeights[i] += (target - this.barHeights[i]) * 0.05;
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.bars; i++) {
            const barHeight = Math.max(5, this.barHeights[i]);
            const x = i * this.barWidth;
            const y = this.canvas.height - barHeight;
            
            // Create gradient for each bar
            const gradient = this.ctx.createLinearGradient(0, y, 0, this.canvas.height);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.5, '#4ecdc4');
            gradient.addColorStop(1, '#45b7d1');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, y, this.barWidth - 2, barHeight);
            
            // Add glow effect when playing
            if (!audio.paused) {
                this.ctx.shadowColor = '#ffffff';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(x, y, this.barWidth - 2, barHeight);
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    animate() {
        this.generateRandomData();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize both systems when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
    new SoundWaveVisualizer();
    new FloatingMusicNotesSystem();
});

// ===== FLOATING MUSIC NOTES FEATURE =====
class FloatingMusicNotesSystem {
    constructor() {
        this.notes = ['♪', '♫', '♬', '♭', '♮', '♯'];
        this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        this.isPlaying = false;
        this.spawnRate = 0; // How often to spawn notes
        this.maxNotes = 50;
        this.noteCount = 0;
        
        this.setupAudioListeners();
        this.startAnimation();
    }
    
    setupAudioListeners() {
        audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.spawnRate = 100; // Spawn a note every 100ms
            this.addBeatGlow();
        });
        
        audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.spawnRate = 0;
            this.removeBeatGlow();
        });
        
        audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.spawnRate = 0;
            this.removeBeatGlow();
        });
    }
    
    spawnNote() {
        if (!this.isPlaying || this.noteCount >= this.maxNotes) return;
        
        const note = document.createElement('div');
        note.className = 'music-note';
        note.textContent = this.notes[Math.floor(Math.random() * this.notes.length)];
        note.style.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Random horizontal position along the mini player
        const miniPlayer = document.querySelector('.mini-player');
        const miniRect = miniPlayer.getBoundingClientRect();
        const randomX = miniRect.left + Math.random() * miniRect.width;
        const randomY = miniRect.top;
        
        note.style.left = randomX + 'px';
        note.style.top = randomY + 'px';
        
        // Random drift direction
        if (Math.random() > 0.5) {
            note.classList.add('drift-left');
        } else {
            note.classList.add('drift-right');
        }
        
        document.body.appendChild(note);
        this.noteCount++;
        
        // Remove note after animation completes
        setTimeout(() => {
            note.remove();
            this.noteCount--;
        }, 3000);
    }
    
    // Pulse effect on the mini player when beat happens
    triggerBeatEffect() {
        if (!this.isPlaying) return;
        
        const miniPlayer = document.querySelector('.mini-player');
        miniPlayer.classList.remove('beat-pulse');
        // Trigger reflow to restart animation
        void miniPlayer.offsetWidth;
        miniPlayer.classList.add('beat-pulse');
    }
    
    // Add glow to mini player
    addBeatGlow() {
        const miniPlayer = document.querySelector('.mini-player');
        miniPlayer.classList.add('beat-glow');
    }
    
    // Remove glow from mini player
    removeBeatGlow() {
        const miniPlayer = document.querySelector('.mini-player');
        miniPlayer.classList.remove('beat-glow');
    }
    
    startAnimation() {
        setInterval(() => {
            this.spawnNote();
        }, this.spawnRate > 0 ? this.spawnRate : 200);
    }
}

