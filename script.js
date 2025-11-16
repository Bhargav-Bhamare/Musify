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
