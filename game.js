// ============================================
// MYSTERY BOX GAME - ENHANCED WITH LIGHT SHOW
// ============================================

class MysteryBoxGame {
  constructor() {
    // Game state
    this.prizes = [];
    this.boxMappings = new Map(); // box number -> prize
    this.openedBoxes = new Set();
    this.currentPage = 1;
    this.totalBoxes = 100;
    this.boxesPerPage = 20;

    // Settings
    this.suspenseDuration = 2000; // ms
    this.soundEnabled = true;
    this.competitionName = "CARP LIFE MYSTERY BOX";
    this.competitionDate = this.formatDate(new Date());

    // Audio context for sound effects
    this.audioContext = null;
    this.isAnimating = false;

    // Initialize
    this.init();
  }

  init() {
    this.setupAudio();
    this.setupEventListeners();
    this.loadDefaultPrizes();
    this.updateCompetitionHeader();
    this.renderCurrentPage();
    this.updatePrizeList();

    // Auto-open setup on first load
    if (!localStorage.getItem("hasSetupBefore")) {
      this.showModal("setupModal");
    }
  }

  setupAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.warn("Audio not supported");
      this.soundEnabled = false;
    }
  }

  setupEventListeners() {
    // Header buttons
    document.getElementById("prizeListBtn").addEventListener("click", () => {
      this.updatePrizeList();
      this.showModal("prizeListModal");
    });

    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.showModal("setupModal");
    });

    // Setup modal
    document.getElementById("saveSetup").addEventListener("click", () => {
      this.saveSetup();
    });

    document.getElementById("csvUpload").addEventListener("change", (e) => {
      this.handleCSVUpload(e);
    });

    document.getElementById("suspenseTime").addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById("suspenseValue").textContent =
        value.toFixed(1) + "s";
    });

    // Pagination
    document.getElementById("prevPage").addEventListener("click", () => {
      this.changePage(-1);
    });

    document.getElementById("nextPage").addEventListener("click", () => {
      this.changePage(1);
    });

    // Reset button
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to reset the entire competition? This will clear all opened boxes."
        )
      ) {
        this.resetGame();
      }
    });

    // Prize reveal close
    document.getElementById("closeReveal").addEventListener("click", () => {
      this.hideModal("prizeRevealModal");
    });

    // Modal close buttons
    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modalId = e.target.dataset.modal;
        this.hideModal(modalId);
      });
    });

    // Close modals on background click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    });
  }

  loadDefaultPrizes() {
    // Default prize set - will be replaced by CSV upload
    this.prizes = [
      { name: "Rod & Reel Combo", value: "£250" },
      { name: "Tackle Box Set", value: "£150" },
      { name: "Premium Bait Pack", value: "£50" },
      { name: "Fishing Chair", value: "£100" },
      { name: "Bivvy Shelter", value: "£200" },
      { name: "Landing Net", value: "£75" },
      { name: "Unhooking Mat", value: "£80" },
      { name: "Carp Fishing DVD Set", value: "£30" },
      { name: "Fishing Voucher", value: "£500" },
      { name: "Bite Alarms Set", value: "£120" },
    ];

    // Pad with smaller prizes to reach 100
    while (this.prizes.length < this.totalBoxes) {
      const smallPrizes = [
        { name: "£10 Voucher", value: "£10" },
        { name: "£20 Voucher", value: "£20" },
        { name: "£5 Voucher", value: "£5" },
        { name: "Fishing Line", value: "£15" },
        { name: "Hooks Pack", value: "£12" },
      ];
      this.prizes.push(
        smallPrizes[Math.floor(Math.random() * smallPrizes.length)]
      );
    }

    this.randomizeBoxMappings();
  }

  randomizeBoxMappings() {
    // Clear existing mappings
    this.boxMappings.clear();

    // Create shuffled array of box numbers
    const boxNumbers = Array.from({ length: this.totalBoxes }, (_, i) => i + 1);
    this.shuffleArray(boxNumbers);

    // Map prizes to random box numbers
    this.prizes.forEach((prize, index) => {
      this.boxMappings.set(boxNumbers[index], prize);
    });
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.parseCSV(text);
    };
    reader.readAsText(file);
  }

  parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const prizes = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV (handle quoted fields)
      const fields = this.parseCSVLine(line);
      if (fields.length >= 2) {
        prizes.push({
          name: fields[0].trim(),
          value: fields[1].trim(),
        });
      }
    }

    if (prizes.length > 0) {
      this.prizes = prizes;
      this.totalBoxes = prizes.length;
      this.randomizeBoxMappings();
      alert(`Successfully loaded ${prizes.length} prizes from CSV!`);
    } else {
      alert("No valid prizes found in CSV. Please check the format.");
    }
  }

  parseCSVLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current);

    return fields.map((f) => f.replace(/^"|"$/g, ""));
  }

  saveSetup() {
    // Get values from setup form
    this.competitionName = document.getElementById("compNameInput").value;
    this.competitionDate = document.getElementById("compDateInput").value;
    this.suspenseDuration =
      parseFloat(document.getElementById("suspenseTime").value) * 1000;
    this.boxesPerPage = parseInt(document.getElementById("boxesPerPage").value);
    this.soundEnabled = document.getElementById("soundEnabled").checked;

    // Update UI
    this.updateCompetitionHeader();
    this.currentPage = 1;
    this.renderCurrentPage();

    // Mark as setup
    localStorage.setItem("hasSetupBefore", "true");

    this.hideModal("setupModal");
  }

  updateCompetitionHeader() {
    document.getElementById("compTitle").textContent = this.competitionName;
    document.getElementById("compDate").textContent = this.competitionDate;
  }

  renderCurrentPage() {
    const startBox = (this.currentPage - 1) * this.boxesPerPage + 1;
    const endBox = Math.min(startBox + this.boxesPerPage - 1, this.totalBoxes);

    const grid = document.getElementById("boxesGrid");
    grid.innerHTML = "";

    for (let boxNum = startBox; boxNum <= endBox; boxNum++) {
      const boxElement = this.createBoxElement(boxNum);
      grid.appendChild(boxElement);
    }

    this.updatePagination(startBox, endBox);
  }

  createBoxElement(boxNum) {
    const box = document.createElement("div");
    box.className = "mystery-box";
    box.dataset.boxNum = boxNum;

    if (this.openedBoxes.has(boxNum)) {
      box.classList.add("locked");
    }

    box.innerHTML = `
          <div class="box-content">
              <div class="box-number">${boxNum}</div>
              <div class="box-icon">🎁</div>
              <div class="box-label">TAP TO REVEAL</div>
          </div>
      `;

    box.addEventListener("click", () => this.openBox(boxNum, box));

    return box;
  }

  updatePagination(startBox, endBox) {
    const totalPages = Math.ceil(this.totalBoxes / this.boxesPerPage);

    document.getElementById("currentPage").textContent = this.currentPage;
    document.getElementById("totalPages").textContent = totalPages;
    document.getElementById("boxRange").textContent = `${startBox}-${endBox}`;

    // Update navigation buttons
    document.getElementById("prevPage").disabled = this.currentPage === 1;
    document.getElementById("nextPage").disabled =
      this.currentPage === totalPages;

    // Update page dots
    const dotsContainer = document.getElementById("pageDots");
    dotsContainer.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = "page-dot";
      if (i === this.currentPage) {
        dot.classList.add("active");
      }
      dot.addEventListener("click", () => {
        this.currentPage = i;
        this.renderCurrentPage();
      });
      dotsContainer.appendChild(dot);
    }
  }

  changePage(direction) {
    const totalPages = Math.ceil(this.totalBoxes / this.boxesPerPage);
    this.currentPage = Math.max(
      1,
      Math.min(this.currentPage + direction, totalPages)
    );
    this.renderCurrentPage();
  }

  async openBox(boxNum, boxElement) {
    // Prevent opening if already opened or animating
    if (this.openedBoxes.has(boxNum) || this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    const prize = this.boxMappings.get(boxNum);

    if (!prize) {
      console.error("No prize mapped to box", boxNum);
      this.isAnimating = false;
      return;
    }

    // Suspense phase
    boxElement.classList.add("suspense");
    if (this.soundEnabled) {
      this.playSuspenseSound();
    }

    await this.delay(this.suspenseDuration);

    // Opening phase
    boxElement.classList.remove("suspense");
    boxElement.classList.add("opening");

    await this.delay(800);

    // Mark as opened
    this.openedBoxes.add(boxNum);

    // Reveal prize
    this.showPrizeReveal(boxNum, prize);

    // Lock the box
    boxElement.classList.remove("opening");
    boxElement.classList.add("locked");

    this.isAnimating = false;
  }

  showPrizeReveal(boxNum, prize) {
    // Update reveal modal content
    document.getElementById("prizeIcon").textContent =
      this.getPrizeEmoji(prize);
    document.getElementById("prizeName").textContent = prize.name;
    document.getElementById("prizeValue").textContent = prize.value;
    document.getElementById("revealBoxNumber").textContent = boxNum;

    // Show modal
    this.showModal("prizeRevealModal");

    // Play sound and effects
    if (this.soundEnabled) {
      this.playRevealSound();
    }

    // EPIC LIGHT SHOW + CONFETTI
    this.createLightShow();
    this.createEnhancedConfetti();

    // Add orbiting confetti around the modal
    this.createModalConfetti();

    // Update prize list
    this.updatePrizeList();
  }

  getPrizeEmoji(prize) {
    const value = prize.value.toLowerCase();
    if (value.includes("500") || value.includes("grand")) return "🏆";
    if (value.includes("250") || value.includes("200")) return "💎";
    if (value.includes("100")) return "🎉";
    if (value.includes("voucher")) return "🎟️";
    return "🎁";
  }

  // ============================================
  // EPIC LIGHT SHOW EFFECTS
  // ============================================
  createLightShow() {
    // Central burst explosion
    this.createLightBurst();

    // Radial light rays
    this.createLightRays();

    // Pulsing lights around screen
    this.createPulsingLights();
  }

  createLightBurst() {
    const colors = [
      "rgba(255, 215, 0, 0.8)", // Gold
      "rgba(178, 75, 243, 0.8)", // Purple
      "rgba(75, 158, 243, 0.8)", // Blue
      "rgba(243, 75, 180, 0.8)", // Pink
      "rgba(75, 243, 232, 0.8)", // Cyan
    ];

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const burst = document.createElement("div");
        burst.className = "light-burst";
        burst.style.left = "50%";
        burst.style.top = "50%";
        burst.style.transform = "translate(-50%, -50%)";
        burst.style.background = `radial-gradient(circle, ${
          colors[i % colors.length]
        } 0%, transparent 70%)`;
        burst.style.animationDelay = `${i * 0.1}s`;

        document.body.appendChild(burst);

        setTimeout(() => burst.remove(), 1500);
      }, i * 100);
    }
  }

  createLightRays() {
    const colors = [
      "rgba(255, 215, 0, 0.6)",
      "rgba(178, 75, 243, 0.6)",
      "rgba(75, 158, 243, 0.6)",
      "rgba(243, 75, 180, 0.6)",
      "rgba(75, 243, 232, 0.6)",
    ];

    // Create 24 rays in a circle
    for (let i = 0; i < 24; i++) {
      const ray = document.createElement("div");
      ray.className = "light-ray";
      ray.style.background = `linear-gradient(to bottom, ${
        colors[i % colors.length]
      }, transparent)`;
      ray.style.transform = `translate(-50%, -50%) rotate(${i * 15}deg)`;
      ray.style.animationDelay = `${i * 0.02}s`;

      document.body.appendChild(ray);

      setTimeout(() => ray.remove(), 1200);
    }
  }

  createPulsingLights() {
    const positions = [
      { x: "10%", y: "20%" },
      { x: "90%", y: "20%" },
      { x: "10%", y: "80%" },
      { x: "90%", y: "80%" },
      { x: "50%", y: "10%" },
      { x: "50%", y: "90%" },
      { x: "20%", y: "50%" },
      { x: "80%", y: "50%" },
    ];

    const colors = [
      "rgba(255, 215, 0, 0.5)",
      "rgba(178, 75, 243, 0.5)",
      "rgba(75, 158, 243, 0.5)",
      "rgba(243, 75, 180, 0.5)",
    ];

    positions.forEach((pos, index) => {
      setTimeout(() => {
        const light = document.createElement("div");
        light.style.position = "fixed";
        light.style.left = pos.x;
        light.style.top = pos.y;
        light.style.width = "150px";
        light.style.height = "150px";
        light.style.borderRadius = "50%";
        light.style.background = `radial-gradient(circle, ${
          colors[index % colors.length]
        } 0%, transparent 70%)`;
        light.style.pointerEvents = "none";
        light.style.zIndex = "9996";
        light.style.transform = "translate(-50%, -50%)";
        light.style.animation = "burstExpand 1.5s ease-out forwards";

        document.body.appendChild(light);

        setTimeout(() => light.remove(), 1600);
      }, index * 80);
    });
  }

  // ============================================
  // ENHANCED CONFETTI EFFECTS
  // ============================================
  createEnhancedConfetti() {
    const colors = [
      "#FFD700",
      "#DC143C",
      "#00C853",
      "#FF69B4",
      "#00E676",
      "#FF9800",
      "#8338ec",
      "#b24bf3",
      "#4b9ef3",
      "#f34bb4",
      "#4bf3e8",
    ];

    const shapes = ["circle", "square", "rectangle"];

    // Create 200 confetti pieces for intense effect
    for (let i = 0; i < 200; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.className = "confetti";

        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 12;

        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.top = "-30px";
        confetti.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];

        // Different shapes
        if (shape === "rectangle") {
          confetti.style.width = size + "px";
          confetti.style.height = size * 2 + "px";
          confetti.style.borderRadius = "2px";
        } else if (shape === "square") {
          confetti.style.width = size + "px";
          confetti.style.height = size + "px";
          confetti.style.borderRadius = "1px";
        } else {
          confetti.style.width = size + "px";
          confetti.style.height = size + "px";
        }

        // Random rotation and fall speed
        const duration = 2 + Math.random() * 3;
        const rotation = Math.random() * 720 - 360;
        const sway = (Math.random() - 0.5) * 100;

        confetti.style.animation = `confettiFall ${duration}s ease-out forwards`;
        confetti.style.transform = `rotate(${rotation}deg) translateX(${sway}px)`;

        // Add some glow to certain pieces
        if (Math.random() > 0.7) {
          confetti.style.boxShadow = `0 0 10px ${confetti.style.backgroundColor}`;
        }

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), duration * 1000 + 500);
      }, i * 8); // Faster spawn rate
    }
  }

  // ============================================
  // ORBITING CONFETTI AROUND MODAL
  // ============================================
  createModalConfetti() {
    const modal = document.querySelector(".prize-reveal-modal .modal-content");
    if (!modal) return;

    const colors = [
      "#FFD700",
      "#DC143C",
      "#00C853",
      "#FF69B4",
      "#00E676",
      "#FF9800",
      "#8338ec",
      "#b24bf3",
      "#4b9ef3",
      "#f34bb4",
      "#4bf3e8",
    ];

    // Create 30 orbiting particles
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        particle.className = "modal-confetti";

        const size = 8 + Math.random() * 6;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];

        // Position at center of modal
        particle.style.left = "50%";
        particle.style.top = "50%";

        // Random orbit parameters
        const duration = 3 + Math.random() * 2;
        const delay = Math.random() * 2;

        particle.style.animation = `orbitConfetti ${duration}s linear ${delay}s infinite`;

        // Add glow
        particle.style.boxShadow = `0 0 10px ${particle.style.backgroundColor}`;

        modal.appendChild(particle);

        // Clean up when modal closes
        const removeParticle = () => {
          if (particle.parentNode) {
            particle.remove();
          }
        };

        // Set timeout to clean up after a while
        setTimeout(removeParticle, 30000);
      }, i * 100);
    }

    // Add continuous floating particles inside modal
    this.createFloatingParticles(modal);
  }

  createFloatingParticles(modal) {
    const colors = [
      "rgba(255, 215, 0, 0.6)",
      "rgba(178, 75, 243, 0.6)",
      "rgba(75, 158, 243, 0.6)",
      "rgba(243, 75, 180, 0.6)",
      "rgba(75, 243, 232, 0.6)",
    ];

    // Create 20 floating particles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        particle.style.position = "absolute";
        particle.style.width = "6px";
        particle.style.height = "6px";
        particle.style.borderRadius = "50%";
        particle.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";
        particle.style.pointerEvents = "none";
        particle.style.animation = `floatUpDown ${
          3 + Math.random() * 2
        }s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 2 + "s";
        particle.style.boxShadow = `0 0 8px ${particle.style.backgroundColor}`;
        particle.style.zIndex = "50";

        modal.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 30000);
      }, i * 150);
    }
  }

  updatePrizeList() {
    const container = document.getElementById("prizeListContainer");
    container.innerHTML = "";

    // Update stats
    const totalPrizes = this.prizes.length;
    const claimedPrizes = this.openedBoxes.size;
    const remainingPrizes = totalPrizes - claimedPrizes;

    document.getElementById("totalPrizes").textContent = totalPrizes;
    document.getElementById("claimedPrizes").textContent = claimedPrizes;
    document.getElementById("remainingPrizes").textContent = remainingPrizes;

    // Create sorted list of all prizes
    const prizeEntries = Array.from(this.boxMappings.entries());

    prizeEntries.forEach(([boxNum, prize]) => {
      const isWon = this.openedBoxes.has(boxNum);

      const item = document.createElement("div");
      item.className = "prize-item";
      if (isWon) {
        item.classList.add("claimed");
      }

      item.innerHTML = `
              <div class="prize-item-info">
                  <div class="prize-item-name">${prize.name}</div>
                  <div class="prize-item-value">${prize.value}</div>
                  <div class="prize-item-box">Box #${boxNum}</div>
              </div>
              ${isWon ? '<div class="prize-item-status won">WON</div>' : ""}
          `;

      container.appendChild(item);
    });
  }

  resetGame() {
    this.openedBoxes.clear();
    this.randomizeBoxMappings(); // Re-randomize for fairness
    this.currentPage = 1;
    this.renderCurrentPage();
    this.updatePrizeList();
  }

  // Sound effects
  playTone(frequency, duration, type = "sine", volume = 0.3) {
    if (!this.audioContext || !this.soundEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playSuspenseSound() {
    // Rising tension sound
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.playTone(200 + i * 40, 0.1, "square", 0.2);
      }, i * 100);
    }
  }

  playRevealSound() {
    // Victory fanfare
    this.playTone(523.25, 0.2, "sine", 0.4); // C
    setTimeout(() => this.playTone(659.25, 0.2, "sine", 0.4), 100); // E
    setTimeout(() => this.playTone(783.99, 0.2, "sine", 0.4), 200); // G
    setTimeout(() => this.playTone(1046.5, 0.5, "sine", 0.4), 300); // C (high)
  }

  // Utility functions
  showModal(modalId) {
    document.getElementById(modalId).classList.add("active");
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("active");

    // Clean up modal confetti particles
    if (modalId === "prizeRevealModal") {
      const modalContent = modal.querySelector(".modal-content");
      if (modalContent) {
        const particles = modalContent.querySelectorAll(
          '.modal-confetti, [style*="floatUpDown"]'
        );
        particles.forEach((particle) => particle.remove());
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  formatDate(date) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const suffix = this.getDaySuffix(day);
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName} ${day}${suffix} ${month} ${year}`;
  }

  getDaySuffix(day) {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.game = new MysteryBoxGame();
});
