const prizes = [
  { icon: "🏆", text: "GRAND PRIZE!" },
  { icon: "💎", text: "FREE PRODUCT" },
  { icon: "🎉", text: "$100 VOUCHER" },
];

let openedBoxes = new Set();
let isAnimating = false;

// Audio context for better sound
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, duration, type = "sine") {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playSuspenseSound() {
  // Rising tension sound
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      playTone(200 + i * 30, 0.1, "square");
    }, i * 100);
  }
}

function playRevealSound() {
  // Victory fanfare
  playTone(523.25, 0.2, "sine"); // C
  setTimeout(() => playTone(659.25, 0.2, "sine"), 100); // E
  setTimeout(() => playTone(783.99, 0.2, "sine"), 200); // G
  setTimeout(() => playTone(1046.5, 0.4, "sine"), 300); // C (high)
}

function initBoxes() {
  const container = document.getElementById("boxesContainer");
  container.innerHTML = "";

  for (let i = 1; i <= 3; i++) {
    const box = document.createElement("div");
    box.className = "mystery-box";
    box.dataset.boxId = i;

    box.innerHTML = `
                <div class="box-visual">
                    <div class="box-number">${i}</div>
                    <div class="box-icon">🎁</div>
                </div>
            `;

    box.addEventListener("click", () => openBox(i, box));
    container.appendChild(box);
  }
}

function openBox(boxId, boxElement) {
  if (openedBoxes.has(boxId) || isAnimating) return;

  isAnimating = true;
  const prize = prizes[boxId - 1];

  // Suspense phase (1.8 seconds)
  boxElement.classList.add("suspense");
  playSuspenseSound();

  setTimeout(() => {
    // Opening phase
    boxElement.classList.remove("suspense");
    boxElement.classList.add("opening");

    setTimeout(() => {
      // Reveal phase
      showPrizeReveal(prize);
      openedBoxes.add(boxId);
      playRevealSound();

      setTimeout(() => {
        boxElement.classList.remove("opening");
        boxElement.classList.add("locked");
        isAnimating = false;
      }, 100);
    }, 800);
  }, 1800);
}

function showPrizeReveal(prize) {
  const overlay = document.getElementById("prizeOverlay");
  const content = document.getElementById("prizeContent");

  content.innerHTML = `
            <div class="prize-icon">${prize.icon}</div>
            <div class="prize-text">${prize.text}</div>
            <div class="prize-close">Click anywhere to continue</div>
        `;

  overlay.classList.add("active");
  createConfetti();

  overlay.onclick = () => {
    overlay.classList.remove("active");
    overlay.onclick = null;
  };
}

function createConfetti() {
  const colors = [
    "#ff006e",
    "#8338ec",
    "#3a86ff",
    "#FFD700",
    "#FF69B4",
    "#00ff87",
    "#ff9800",
  ];

  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.top = "-30px";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animation = `confettiFall ${
        2 + Math.random() * 3
      }s ease-out forwards`;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.width = 8 + Math.random() * 10 + "px";
      confetti.style.height = 8 + Math.random() * 10 + "px";

      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 5000);
    }, i * 20);
  }
}

function resetGame() {
  openedBoxes.clear();
  isAnimating = false;
  initBoxes();
}

initBoxes();
