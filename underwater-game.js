// ============================================
// UNDERWATER TREASURE HUNT GAME - ENHANCED WITH BUBBLE SHOW
// ============================================

class UnderwaterTreasureGame {
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
    this.competitionName = "DEEP SEA TREASURE HUNT";
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
    this.createOceanLife();

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
          "Are you sure you want to reset the entire dive? This will close all opened treasure chests."
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
    // Default fishing-themed prize set
    this.prizes = [
      { name: "Premium Fishing Rod", value: "£250" },
      { name: "Deluxe Tackle Box", value: "£150" },
      { name: "Live Bait Station", value: "£50" },
      { name: "Fishing Kayak", value: "£400" },
      { name: "Fish Finder GPS", value: "£200" },
      { name: "Landing Net Pro", value: "£75" },
      { name: "Cooler & Storage", value: "£80" },
      { name: "Fishing License Bundle", value: "£30" },
      { name: "Boat Rental Voucher", value: "£500" },
      { name: "Lure Collection", value: "£120" },
    ];

    // Pad with smaller prizes to reach 100
    while (this.prizes.length < this.totalBoxes) {
      const smallPrizes = [
        { name: "£10 Tackle Voucher", value: "£10" },
        { name: "£20 Bait Voucher", value: "£20" },
        { name: "£5 Hook Pack", value: "£5" },
        { name: "Fishing Line Spool", value: "£15" },
        { name: "Sinker Weight Set", value: "£12" },
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
      alert(`Successfully loaded ${prizes.length} treasures from CSV!`);
    } else {
      alert("No valid treasures found in CSV. Please check the format.");
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

    // Use treasure chest images: closed for unopened, open for opened
    const chestImg = this.openedBoxes.has(boxNum)
      ? '<img src="./images/treasure-open.png" alt="Opened Treasure">'
      : '<img src="./images/treasure-closed.png" alt="Treasure Chest">';

    box.innerHTML = `
            <div class="box-content">
                <div class="box-number">${boxNum}</div>
                <div class="box-icon">${chestImg}</div>
                ${this.openedBoxes.has(boxNum) ? '<div class="box-label">OPENED</div>' : ''}
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
      console.error("No treasure mapped to chest", boxNum);
      this.isAnimating = false;
      return;
    }

    // Suspense phase
    boxElement.classList.add("suspense");
    if (this.soundEnabled) {
      this.playSuspenseSound();
    }

    await this.delay(this.suspenseDuration);
    boxElement.classList.remove("suspense");

    // Create dark backdrop to focus attention on the chest
    const backdrop = document.createElement("div");
    backdrop.className = "box-clone-backdrop";
    document.body.appendChild(backdrop);

    // Create a floating clone of the box at its current position
    const rect = boxElement.getBoundingClientRect();
    const clone = document.createElement("div");
    clone.className = "box-clone";
    clone.innerHTML = '<img src="./images/treasure-closed.png" alt="Treasure Chest">';
    clone.style.left = rect.left + "px";
    clone.style.top = rect.top + "px";
    clone.style.width = rect.width + "px";
    clone.style.height = rect.height + "px";
    document.body.appendChild(clone);

    // Hide the original box during animation
    boxElement.style.visibility = "hidden";

    // Trigger reflow, then fade in backdrop and animate clone to center
    clone.offsetHeight;
    backdrop.classList.add("active");
    clone.classList.add("centered");

    // Wait for fly-to-center transition
    await this.delay(600);

    // Swap image to open chest with pop effect
    clone.innerHTML = '<img src="./images/treasure-open.png" alt="Opened Treasure">';
    clone.classList.add("opened");

    // Brief pause to show the opened chest in the spotlight
    await this.delay(600);

    // Fade out clone and backdrop, then show prize reveal
    clone.classList.add("fade-out");
    backdrop.classList.add("fade-out");

    // Mark as opened
    this.openedBoxes.add(boxNum);

    // Reveal prize
    this.showPrizeReveal(boxNum, prize);

    // Lock the original box and swap to open treasure chest image
    boxElement.classList.add("locked");
    const iconEl = boxElement.querySelector(".box-icon");
    if (iconEl) {
      iconEl.innerHTML = '<img src="./images/treasure-open.png" alt="Opened Treasure">';
    }
    boxElement.style.visibility = "visible";

    // Remove clone and backdrop after fade completes
    await this.delay(400);
    clone.remove();
    backdrop.remove();

    this.isAnimating = false;
  }

  showPrizeReveal(boxNum, prize) {
    // Update reveal modal content
    const prizeIcon = document.getElementById("prizeIcon");
    prizeIcon.textContent = this.getPrizeEmoji(prize);

    document.getElementById("prizeName").textContent = prize.name;
    document.getElementById("prizeValue").textContent = prize.value;
    document.getElementById("revealBoxNumber").textContent = boxNum;

    // Show modal
    this.showModal("prizeRevealModal");

    // Play sound and effects
    if (this.soundEnabled) {
      this.playRevealSound();
    }

    // EPIC UNDERWATER LIGHT SHOW + BUBBLES
    this.createLightShow();
    this.createEnhancedBubbles();

    // Add floating bubbles around the modal
    this.createModalBubbles();

    // Update prize list
    this.updatePrizeList();
  }

  getPrizeEmoji(prize) {
    const value = prize.value.toLowerCase();
    const name = prize.name.toLowerCase();

    if (
      value.includes("500") ||
      name.includes("grand") ||
      name.includes("boat")
    )
      return "🏆";
    if (value.includes("400") || name.includes("kayak")) return "🚣";
    if (value.includes("250") || value.includes("200")) return "🎣";
    if (name.includes("rod") || name.includes("reel")) return "🎣";
    if (name.includes("fish")) return "🐟";
    if (name.includes("tackle") || name.includes("lure")) return "🪝";
    if (value.includes("voucher")) return "🎟️";
    return "💎";
  }

  // ============================================
  // EPIC UNDERWATER LIGHT SHOW EFFECTS
  // ============================================
  createLightShow() {
    // Central burst explosion with ocean colors
    this.createLightBurst();

    // Radial light rays
    this.createLightRays();

    // Pulsing lights around screen
    this.createPulsingLights();
  }

  createLightBurst() {
    const colors = [
      "rgba(255, 215, 0, 0.8)", // Gold
      "rgba(0, 212, 170, 0.8)", // Aqua Teal
      "rgba(0, 102, 204, 0.8)", // Ocean Blue
      "rgba(32, 178, 170, 0.8)", // Sea Green
      "rgba(255, 107, 157, 0.8)", // Coral Pink
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
      "rgba(0, 212, 170, 0.6)",
      "rgba(0, 102, 204, 0.6)",
      "rgba(32, 178, 170, 0.6)",
      "rgba(255, 107, 157, 0.6)",
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
      "rgba(0, 212, 170, 0.5)",
      "rgba(0, 102, 204, 0.5)",
      "rgba(32, 178, 170, 0.5)",
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
  // ENHANCED BUBBLE EFFECTS (instead of confetti)
  // ============================================
  createEnhancedBubbles() {
    // Create 150 bubble pieces for intense underwater effect
    for (let i = 0; i < 150; i++) {
      setTimeout(() => {
        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const size = 8 + Math.random() * 25;

        bubble.style.left = Math.random() * 100 + "vw";
        bubble.style.bottom = "-30px";
        bubble.style.width = size + "px";
        bubble.style.height = size + "px";

        // Random sway for bubble movement
        const sway = (Math.random() - 0.5) * 150;
        bubble.style.setProperty("--sway", sway + "px");

        // Random rise speed
        const duration = 3 + Math.random() * 4;
        bubble.style.animation = `bubbleRise ${duration}s ease-out forwards`;

        // Add some extra shine to certain bubbles
        if (Math.random() > 0.7) {
          bubble.style.boxShadow = `inset 0 0 15px rgba(255, 255, 255, 0.7),
                                       0 0 25px rgba(0, 212, 170, 0.5)`;
        }

        document.body.appendChild(bubble);

        setTimeout(() => bubble.remove(), duration * 1000 + 500);
      }, i * 12); // Faster spawn rate
    }
  }

  // ============================================
  // FLOATING BUBBLES AROUND MODAL
  // ============================================
  createModalBubbles() {
    const modal = document.querySelector(".prize-reveal-modal .modal-content");
    if (!modal) return;

    // Create 40 floating bubble particles
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const bubble = document.createElement("div");
        bubble.className = "modal-bubble";

        const size = 10 + Math.random() * 15;
        bubble.style.width = size + "px";
        bubble.style.height = size + "px";

        // Position at center of modal
        bubble.style.left = "50%";
        bubble.style.top = "50%";

        // Random orbit parameters
        const duration = 4 + Math.random() * 3;
        const delay = Math.random() * 2;

        bubble.style.animation = `orbitBubble ${duration}s linear ${delay}s infinite`;

        modal.appendChild(bubble);

        // Clean up when modal closes
        const removeBubble = () => {
          if (bubble.parentNode) {
            bubble.remove();
          }
        };

        // Set timeout to clean up after a while
        setTimeout(removeBubble, 30000);
      }, i * 120);
    }

    // Add continuous floating particles inside modal
    this.createFloatingParticles(modal);
  }

  createFloatingParticles(modal) {
    const colors = [
      "rgba(255, 255, 255, 0.5)",
      "rgba(0, 212, 170, 0.4)",
      "rgba(255, 215, 0, 0.4)",
      "rgba(0, 102, 204, 0.4)",
      "rgba(240, 248, 255, 0.5)",
    ];

    // Create 25 floating particles
    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        particle.style.position = "absolute";
        const size = 5 + Math.random() * 8;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.borderRadius = "50%";
        particle.style.background = `radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.8), ${
              colors[Math.floor(Math.random() * colors.length)]
            })`;
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";
        particle.style.pointerEvents = "none";
        particle.style.animation = `floatUpDown ${
          3 + Math.random() * 2
        }s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 2 + "s";
        particle.style.boxShadow = `inset 0 0 5px rgba(255, 255, 255, 0.6)`;
        particle.style.zIndex = "50";

        modal.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 30000);
      }, i * 180);
    }
  }

  // ============================================
  // ANIMATED SINE WAVE BACKGROUND
  // ============================================
  createOceanLife() {
    this.createSineWaves();
    this.spawnFish();
  }

  spawnFish() {
    const fishTypes = ["🐟", "🐠", "🐡", "🦈", "🐙", "🦑", "🦐", "🐚"];
    const fishCount = 12;

    const createFish = () => {
      const fish = document.createElement("div");
      fish.className = "swimming-fish";

      const goingRight = Math.random() > 0.5;
      fish.classList.add(goingRight ? "left-to-right" : "right-to-left");

      fish.textContent = fishTypes[Math.floor(Math.random() * fishTypes.length)];
      fish.style.top = (10 + Math.random() * 80) + "vh";
      fish.style.fontSize = (1 + Math.random() * 1.5) + "rem";
      fish.style.opacity = 0.3 + Math.random() * 0.4;

      const duration = 15 + Math.random() * 25;
      fish.style.animationDuration = duration + "s";
      fish.style.animationDelay = Math.random() * 10 + "s";

      document.body.appendChild(fish);
    };

    for (let i = 0; i < fishCount; i++) {
      createFish();
    }

    // Continuously spawn new fish
    setInterval(() => {
      createFish();
    }, 8000);
  }

  createSineWaves() {
    const canvas = document.createElement("canvas");
    canvas.className = "sine-wave-canvas";
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");

    const waves = [
      { amplitude: 25, frequency: 0.008, speed: 0.004, color: "rgba(0, 102, 204, 0.45)", lineWidth: 2 },
      { amplitude: 18, frequency: 0.012, speed: -0.005, color: "rgba(0, 212, 170, 0.4)", lineWidth: 1.5 },
      { amplitude: 30, frequency: 0.006, speed: 0.003, color: "rgba(32, 178, 170, 0.35)", lineWidth: 2.5 },
      { amplitude: 15, frequency: 0.015, speed: -0.006, color: "rgba(0, 150, 200, 0.35)", lineWidth: 1.5 },
      { amplitude: 22, frequency: 0.01, speed: 0.0045, color: "rgba(0, 80, 160, 0.3)", lineWidth: 2 },
      { amplitude: 12, frequency: 0.02, speed: -0.003, color: "rgba(0, 200, 170, 0.3)", lineWidth: 1 },
      { amplitude: 35, frequency: 0.005, speed: 0.002, color: "rgba(0, 60, 120, 0.25)", lineWidth: 3 },
    ];

    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = canvas.height / (waves.length + 1);

      waves.forEach((wave, i) => {
        const baseY = spacing * (i + 1);

        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = baseY + Math.sin(x * wave.frequency + time * wave.speed * 60) * wave.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      time++;
      requestAnimationFrame(animate);
    };

    animate();
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
                </div>
                ${isWon ? '<div class="prize-item-status won">FOUND</div>' : ""}
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
    // Underwater diving/bubbling tension sound
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.playTone(150 + i * 30, 0.1, "sine", 0.2);
      }, i * 100);
    }
  }

  playRevealSound() {
    // Treasure discovery fanfare (ocean themed)
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

    // Clean up modal bubble particles
    if (modalId === "prizeRevealModal") {
      const modalContent = modal.querySelector(".modal-content");
      if (modalContent) {
        const particles = modalContent.querySelectorAll(
          '.modal-bubble, [style*="floatUpDown"]'
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
  window.game = new UnderwaterTreasureGame();
});
