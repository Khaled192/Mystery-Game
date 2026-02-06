// ============================================
// CARP FISHING COMPETITION - PRIZE DRAW GAME
// ============================================

class CarpFishingPrizeDraw {
  constructor() {
    // Game state
    this.prizes = [];
    this.boxMappings = new Map(); // peg number -> prize
    this.openedBoxes = new Set();
    this.currentPage = 1;
    this.totalBoxes = 100;
    this.boxesPerPage = 20;

    // Settings
    this.suspenseDuration = 2000; // ms
    this.soundEnabled = true;
    this.competitionName = "CARP FISHING COMPETITION";
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
    // Intercept keyboard reload shortcuts (F5, Ctrl+R, Cmd+R) to show custom modal
    const game = this;
    window.addEventListener("keydown", function (e) {
      const isReload = e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");

      if (isReload && game.openedBoxes.size > 0) {
        e.preventDefault();
        game.showConfirm({
          icon: "🔄",
          title: "Reload Page?",
          message: `You have ${game.openedBoxes.size} revealed prize(s). Reloading will lose all progress.`,
          confirmText: "Reload",
          cancelText: "Stay",
          onConfirm: () => {
            window.location.reload();
          },
        });
      }
    });

    // Fallback for browser refresh button / closing tab (native dialog - can't be customized)
    window.addEventListener("beforeunload", function (e) {
      if (game.openedBoxes.size > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    });

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
      if (this.openedBoxes.size === 0) {
        this.showToast("No progress to reset.", "info");
        return;
      }
      this.showConfirm({
        icon: "⚠️",
        title: "Reset Draw?",
        message: `Are you sure you want to reset? This will clear all ${this.openedBoxes.size} revealed prize(s) and cannot be undone.`,
        confirmText: "Reset",
        onConfirm: () => this.resetGame(),
      });
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
    // Default carp fishing prize set
    this.prizes = [
      { name: "Nash Scope Carp Rod", value: "£350" },
      { name: "Shimano Big Baitrunner Reel", value: "£250" },
      { name: "Fox EOS Bivvy", value: "£400" },
      { name: "Sonik SK-TEK Bedchair", value: "£180" },
      { name: "Delkim TXi Plus Alarms", value: "£300" },
      { name: "Trakker Barrow", value: "£220" },
      { name: "Mainline Cell Boilies Bundle", value: "£75" },
      { name: "ESP Carp Tackle Box", value: "£120" },
      { name: "Gardner PVA Mega Bundle", value: "£50" },
      { name: "Korda Underwater Camera", value: "£180" },
    ];

    // Pad with smaller prizes to reach 100
    while (this.prizes.length < this.totalBoxes) {
      const smallPrizes = [
        { name: "£10 Bait Voucher", value: "£10" },
        { name: "£20 Tackle Voucher", value: "£20" },
        { name: "Korda Rig Kit", value: "£15" },
        { name: "Pop-Up Selection", value: "£12" },
        { name: "PVA Mesh Bundle", value: "£8" },
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
      this.showToast(`Successfully loaded ${prizes.length} prizes from CSV!`, "success");
    } else {
      this.showToast("No valid prizes found in CSV. Please check the format.", "error");
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

    // Use prize images: closed for unopened, open for opened
    const chestImg = this.openedBoxes.has(boxNum)
      ? '<img src="./images/openedOyster.png" alt="Prize Revealed">'
      : '<img src="./images/closedOyster.png" alt="Mystery Prize">';

    box.innerHTML = `
            <div class="box-content">
                <div class="box-number">${boxNum}</div>
                <div class="box-icon">${chestImg}</div>
                ${
                  this.openedBoxes.has(boxNum)
                    ? '<div class="box-label">OPENED</div>'
                    : ""
                }
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
      console.error("No prize mapped to peg", boxNum);
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
    clone.innerHTML =
      '<img src="./images/closedOyster.png" alt="Mystery Prize">';
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

    // Swap image to revealed prize with pop effect
    clone.innerHTML =
      '<img src="./images/openedOyster.png" alt="Prize Revealed">';
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

    // Lock the original box and swap to revealed prize image
    boxElement.classList.add("locked");
    const iconEl = boxElement.querySelector(".box-icon");
    if (iconEl) {
      iconEl.innerHTML =
        '<img src="./images/openedOyster.png" alt="Prize Revealed">';
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

    // Celebration effects
    this.createLightShow();
    this.createEnhancedBubbles();

    // Add floating particles around the modal
    this.createModalBubbles();

    // Update prize list
    this.updatePrizeList();
  }

  getPrizeEmoji(prize) {
    const value = prize.value.toLowerCase();
    const name = prize.name.toLowerCase();

    if (
      value.includes("400") ||
      value.includes("350") ||
      name.includes("bivvy")
    )
      return "🏆";
    if (value.includes("300") || name.includes("alarm")) return "🔔";
    if (value.includes("250") || value.includes("200")) return "🎣";
    if (name.includes("rod") || name.includes("reel")) return "🎣";
    if (name.includes("bedchair") || name.includes("barrow")) return "🛏️";
    if (name.includes("bait") || name.includes("boilie")) return "🐟";
    if (name.includes("tackle") || name.includes("rig")) return "🪝";
    if (name.includes("voucher")) return "🎟️";
    if (name.includes("camera")) return "📷";
    return "🐟";
  }

  // ============================================
  // CELEBRATION LIGHT SHOW EFFECTS
  // PERF + CAMERA FIX: colors muted, counts reduced
  // ============================================
  createLightShow() {
    this.createLightBurst();
    this.createLightRays();
    this.createPulsingLights();
  }

  createLightBurst() {
    // CAMERA FIX: muted greens/blues, no bright gold bursts
    const colors = [
      "rgba(93, 138, 102, 0.45)",
      "rgba(45, 90, 123, 0.4)",
      "rgba(61, 107, 79, 0.4)",
      "rgba(74, 124, 89, 0.35)",
      "rgba(45, 90, 123, 0.35)",
    ];

    // Reduced from 5 staggered to 3
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const burst = document.createElement("div");
        burst.className = "light-burst";
        burst.style.left = "50%";
        burst.style.top = "50%";
        burst.style.transform = "translate(-50%, -50%)";
        burst.style.background = `radial-gradient(circle, ${
          colors[i % colors.length]
        } 0%, transparent 70%)`;

        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 1500);
      }, i * 150);
    }
  }

  createLightRays() {
    // CAMERA FIX: muted colors, reduced from 24 to 16 rays
    const colors = [
      "rgba(93, 138, 102, 0.35)",
      "rgba(45, 90, 123, 0.3)",
      "rgba(61, 107, 79, 0.3)",
      "rgba(74, 124, 89, 0.28)",
    ];

    for (let i = 0; i < 16; i++) {
      const ray = document.createElement("div");
      ray.className = "light-ray";
      ray.style.background = `linear-gradient(to bottom, ${
        colors[i % colors.length]
      }, transparent)`;
      ray.style.transform = `translate(-50%, -50%) rotate(${i * 22.5}deg)`;
      ray.style.animationDelay = `${i * 0.025}s`;

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
    ];

    // CAMERA FIX: very muted greens only, no gold
    const colors = [
      "rgba(93, 138, 102, 0.25)",
      "rgba(45, 90, 123, 0.22)",
      "rgba(61, 107, 79, 0.2)",
      "rgba(74, 124, 89, 0.2)",
    ];

    positions.forEach((pos, index) => {
      setTimeout(() => {
        const light = document.createElement("div");
        light.style.position = "fixed";
        light.style.left = pos.x;
        light.style.top = pos.y;
        light.style.width = "120px";
        light.style.height = "120px";
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
      }, index * 100);
    });
  }

  // ============================================
  // CELEBRATION PARTICLE EFFECTS
  // PERF FIX: 150 → 55 bubbles
  // ============================================
  createEnhancedBubbles() {
    for (let i = 0; i < 55; i++) {
      setTimeout(() => {
        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const size = 8 + Math.random() * 22;

        bubble.style.left = Math.random() * 100 + "vw";
        bubble.style.bottom = "-30px";
        bubble.style.width = size + "px";
        bubble.style.height = size + "px";

        const sway = (Math.random() - 0.5) * 120;
        bubble.style.setProperty("--sway", sway + "px");

        const duration = 3 + Math.random() * 4;
        bubble.style.animation = `bubbleRise ${duration}s ease-out forwards`;

        // Subtle shine on some — kept moderate
        if (Math.random() > 0.75) {
          bubble.style.boxShadow = `inset 0 0 10px rgba(255, 255, 255, 0.5),
                                       0 0 16px rgba(93, 138, 102, 0.3)`;
        }

        document.body.appendChild(bubble);
        setTimeout(() => bubble.remove(), duration * 1000 + 500);
      }, i * 18);
    }
  }

  // ============================================
  // FLOATING PARTICLES AROUND MODAL
  // PERF FIX: 40 → 20 modal bubbles, 25 → 12 floaters
  // ============================================
  createModalBubbles() {
    const modal = document.querySelector(".prize-reveal-modal .modal-content");
    if (!modal) return;

    // 20 orbit particles (was 40)
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const bubble = document.createElement("div");
        bubble.className = "modal-bubble";

        const size = 10 + Math.random() * 14;
        bubble.style.width = size + "px";
        bubble.style.height = size + "px";

        bubble.style.left = "50%";
        bubble.style.top = "50%";

        const duration = 4 + Math.random() * 3;
        const delay = Math.random() * 2;

        bubble.style.animation = `orbitBubble ${duration}s linear ${delay}s infinite`;

        modal.appendChild(bubble);

        setTimeout(() => {
          if (bubble.parentNode) bubble.remove();
        }, 25000);
      }, i * 150);
    }

    // 12 floating inner particles (was 25)
    this.createFloatingParticles(modal);
  }

  createFloatingParticles(modal) {
    const colors = [
      "rgba(255, 255, 255, 0.4)",
      "rgba(93, 138, 102, 0.3)",
      "rgba(212, 160, 18, 0.25)",
      "rgba(45, 90, 123, 0.3)",
      "rgba(245, 240, 225, 0.35)",
    ];

    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        particle.style.position = "absolute";
        const size = 5 + Math.random() * 7;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.borderRadius = "50%";
        particle.style.background = `radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.6), ${
              colors[Math.floor(Math.random() * colors.length)]
            })`;
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";
        particle.style.pointerEvents = "none";
        particle.style.animation = `floatUpDown ${
          3 + Math.random() * 2
        }s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 2 + "s";
        particle.style.boxShadow = `inset 0 0 4px rgba(255, 255, 255, 0.4)`;
        particle.style.zIndex = "50";

        modal.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) particle.remove();
        }, 25000);
      }, i * 200);
    }
  }

  // ============================================
  // ANIMATED WATER WAVE BACKGROUND
  // ============================================
  createOceanLife() {
    this.createSineWaves();
    this.spawnFish();
  }

  spawnFish() {
    const fishTypes = ["🐟", "🐠", "🐡", "🍃"];
    const maxFish = 3;
    let activeFish = 0;

    const createFish = (initialDelay) => {
      if (activeFish >= maxFish) return;
      activeFish++;

      const fish = document.createElement("div");
      fish.className = "swimming-fish";

      const goingRight = Math.random() > 0.5;
      fish.classList.add(goingRight ? "right-to-left" : "left-to-right");

      fish.textContent =
        fishTypes[Math.floor(Math.random() * fishTypes.length)];
      fish.style.top = 10 + Math.random() * 80 + "vh";
      fish.style.fontSize = 1 + Math.random() * 1.5 + "rem";
      fish.style.opacity = 0.3 + Math.random() * 0.4;

      const duration = 18 + Math.random() * 22;
      fish.style.animationDuration = duration + "s";
      fish.style.animationDelay = (initialDelay || 0) + "s";

      fish.addEventListener("animationend", () => {
        fish.remove();
        activeFish--;
        setTimeout(() => createFish(0), 2000 + Math.random() * 6000);
      });

      document.body.appendChild(fish);
    };

    for (let i = 0; i < maxFish; i++) {
      createFish(Math.random() * 10);
    }
  }

  createSineWaves() {
    const canvas = document.createElement("canvas");
    canvas.className = "sine-wave-canvas";
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");

    const waves = [
      {
        amplitude: 28,
        frequency: 0.007,
        speed: 0.0012,
        color: "rgba(45, 90, 123, 0.4)",
        lineWidth: 2,
      },
      {
        amplitude: 35,
        frequency: 0.005,
        speed: 0.0008,
        color: "rgba(26, 58, 74, 0.25)",
        lineWidth: 2.5,
      },
    ];

    let lastTime = 0;
    let elapsed = 0;
    const frameInterval = 50; // ~20fps

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = (timestamp) => {
      requestAnimationFrame(animate);

      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta < frameInterval) return;

      lastTime = timestamp;
      elapsed += delta;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = canvas.height / (waves.length + 1);
      const step = 6;

      waves.forEach((wave, i) => {
        const baseY = spacing * (i + 1);

        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;

        for (let x = 0; x <= canvas.width; x += step) {
          const y =
            baseY +
            Math.sin(x * wave.frequency + elapsed * wave.speed) *
              wave.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });
    };

    requestAnimationFrame(animate);
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
    this.randomizeBoxMappings();
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
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.playTone(150 + i * 30, 0.1, "sine", 0.2);
      }, i * 100);
    }
  }

  playRevealSound() {
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

  showConfirm({ icon = "⚠️", title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, isDanger = true }) {
    const modal = document.getElementById("confirmModal");
    const iconEl = document.getElementById("confirmIcon");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const confirmBtn = document.getElementById("confirmOk");
    const cancelBtn = document.getElementById("confirmCancel");

    iconEl.textContent = icon;
    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    // Style the confirm button
    if (isDanger) {
      confirmBtn.classList.remove("confirm-ok-success");
    } else {
      confirmBtn.classList.add("confirm-ok-success");
    }

    this.showModal("confirmModal");

    // Clean up old listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener("click", () => {
      this.hideModal("confirmModal");
      if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener("click", () => {
      this.hideModal("confirmModal");
      if (onCancel) onCancel();
    });
  }

  showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
      success: "✓",
      error: "✕",
      info: "ℹ",
    };

    const titles = {
      success: "Success",
      error: "Error",
      info: "Notice",
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${titles[type] || titles.info}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
    `;

    const closeBtn = toast.querySelector(".toast-close");
    const removeToast = () => {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    };

    closeBtn.addEventListener("click", removeToast);

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.game = new CarpFishingPrizeDraw();
});
