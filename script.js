const audio = document.getElementById("mp-audio");
const playBtn = document.getElementById("mp-play");
const seekBar = document.getElementById("mp-seek");

playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = "⏸";
    } else {
        audio.pause();
        playBtn.textContent = "▶";
    }
});

audio.addEventListener("timeupdate", () => {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
});

seekBar.addEventListener("input", () => {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
});


// mini → full expand
document.getElementById("mini-player").addEventListener("click", () => {
    document.getElementById("full-player").style.display = "flex";
});

// close big player
document.getElementById("fp-close").addEventListener("click", () => {
    document.getElementById("full-player").style.display = "none";
});

// sync play/pause
document.getElementById("fp-play").addEventListener("click", () => {
    let audio = document.getElementById("mp-audio");
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});


