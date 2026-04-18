(function(){
  "use strict";
  
  // Story pages content
  const pages = [
    "For the little one we can't wait to meet—",
    "Your mom once had a pillow she held onto through the years, a quiet comfort through every night.",
    "I hope this pillow becomes the same for you—a place of warmth, safety, and sweet dreams.",
    "Your mom and dad are truly amazing people, and I have no doubt they will be wonderful parents who will fill your life with so much love and care.",
    "And no matter how far we may be, know that Tito Bikoy and Tita Michelle are always with you, watching over you and guarding your dreams. 💛"
  ];

  const finalMessage = `With all our love, little one 🌙💛<span class="signature">— Tito Bikoy & Tita Michelle</span>`;

  // DOM elements
  const welcome = document.getElementById('welcomeScreen');
  const bookContainer = document.getElementById('bookContainer');
  const pageRight = document.getElementById('pageRight');
  const storyText = document.getElementById('story-text');
  const nextBtn = document.getElementById('nextButton');
  const hintMsg = document.getElementById('hintMessage');
  const progressDots = document.getElementById('progressDots');
  const pageNumberLeft = document.getElementById('pageNumberLeft');
  const pageNumberRight = document.getElementById('pageNumberRight');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const swipeHint = document.getElementById('swipeHint');
  const swipeInstruction = document.getElementById('swipeInstruction');

  // State variables
  let currentPage = 0;
  let typingIndex = 0;
  let isTyping = false;
  let typingTimer = null;
  let isFinal = false;
  let isFlipping = false;
  
  // Swipe state
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let dragProgress = 0;
  const SWIPE_THRESHOLD = 80;
  const EDGE_WIDTH = 60;
  
  // Audio
  const lullabyAudio = document.getElementById('lullabyAudio');
  let isPlaying = false;
  let audioInitialized = false;
  
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  // Audio setup
  lullabyAudio.volume = 0.25;
  lullabyAudio.loop = true;
  lullabyAudio.playsInline = true;

  // Loading indicator
  lullabyAudio.addEventListener('loadstart', () => {
    loadingIndicator.classList.add('show');
    loadingIndicator.textContent = 'loading lullaby...';
  });

  lullabyAudio.addEventListener('canplaythrough', () => {
    loadingIndicator.classList.remove('show');
    soundText.textContent = 'play lullaby';
    audioInitialized = true;
  });

  lullabyAudio.addEventListener('error', () => {
    loadingIndicator.classList.remove('show');
    soundIcon.textContent = '📁';
    soundText.textContent = 'add lullaby.mp3';
    audioInitialized = true;
  });

  // Toggle sound
  function toggleSound() {
    if (!audioInitialized) {
      lullabyAudio.load();
      soundText.textContent = 'loading...';
      return;
    }
    
    if (isPlaying) {
      lullabyAudio.pause();
      soundIcon.textContent = '🎵';
      soundText.textContent = 'play lullaby';
      isPlaying = false;
    } else {
      lullabyAudio.play().then(() => {
        soundIcon.textContent = '🎵';
        soundText.textContent = 'lullaby playing';
        isPlaying = true;
      }).catch(error => {
        console.log('Audio play failed:', error);
        soundIcon.textContent = '⚠️';
        soundText.textContent = 'tap to retry';
        isPlaying = false;
      });
    }
  }

  soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSound();
  });

  soundToggle.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });

  // Page flip sound effect
  function playPageFlipSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 523.25;
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(now + 0.15);
      
      setTimeout(() => audioContext.close(), 400);
    } catch(e) {
      // Silent fail
    }
  }

  // Swipe handling
  function handleDragStart(e) {
    if (isFlipping || isTyping || isFinal) return;
    
    const touch = e.touches[0];
    const bookRect = pageRight.getBoundingClientRect();
    const touchX = touch.clientX;
    
    // Only allow swipe from right edge
    if (touchX < bookRect.right - EDGE_WIDTH) return;
    
    isDragging = true;
    startX = touchX;
    currentX = touchX;
    dragProgress = 0;
    
    pageRight.classList.add('dragging');
    pageRight.style.transition = 'none';
    
    swipeInstruction.classList.add('show');
    
    e.preventDefault();
  }

  function handleDragMove(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    currentX = touch.clientX;
    
    const deltaX = startX - currentX;
    dragProgress = Math.max(0, Math.min(1, deltaX / 200));
    
    // Apply rotation based on drag (max 172 degrees)
    const rotation = dragProgress * 172;
    pageRight.style.transform = `rotateY(-${rotation}deg)`;
    
    // Update instruction text
    if (dragProgress > 0.5) {
      swipeInstruction.style.opacity = '1';
      swipeInstruction.innerHTML = '→ release to turn →';
    } else {
      swipeInstruction.style.opacity = '0.7';
      swipeInstruction.innerHTML = '← keep pulling ←';
    }
    
    e.preventDefault();
  }

  function handleDragEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    pageRight.classList.remove('dragging');
    pageRight.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    swipeInstruction.classList.remove('show');
    
    const deltaX = startX - currentX;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && dragProgress > 0.3) {
      // Complete the page turn
      completePageTurn();
    } else {
      // Snap back
      pageRight.style.transform = 'rotateY(0deg)';
      setTimeout(() => {
        pageRight.style.transition = '';
      }, 400);
    }
    
    e.preventDefault();
  }

  function completePageTurn() {
    if (isFlipping) return;
    isFlipping = true;
    
    playPageFlipSound();
    
    // Animate to fully flipped
    pageRight.style.transform = 'rotateY(-172deg)';
    
    setTimeout(() => {
      if (currentPage < pages.length - 1) {
        currentPage++;
        displayPage();
      } else if (!isFinal) {
        isFinal = true;
        displayPage();
      }
      
      // Reset transform after content update
      setTimeout(() => {
        pageRight.style.transition = 'transform 0.3s ease-out';
        pageRight.style.transform = 'rotateY(0deg)';
        
        setTimeout(() => {
          pageRight.style.transition = '';
          isFlipping = false;
          if (swipeHint) swipeHint.style.opacity = '1';
        }, 300);
      }, 50);
    }, 400);
  }

  // Render progress dots
  function renderDots() {
    let dotsHtml = '';
    for (let i = 0; i < pages.length; i++) {
      dotsHtml += `<span class="dot ${i === currentPage ? 'active' : ''}"></span>`;
    }
    progressDots.innerHTML = dotsHtml;
  }

  // Update UI elements
  function updateUI() {
    if (isFinal) {
      nextBtn.textContent = 'with love ✨';
      hintMsg.innerHTML = '<span>💛</span> thank you <span>💛</span>';
      pageNumberLeft.textContent = '— fin —';
      pageNumberRight.textContent = '— fin —';
      if (swipeHint) swipeHint.style.opacity = '0';
    } else {
      nextBtn.textContent = currentPage === pages.length - 1 ? 'finish ✨' : 'turn the page ↪';
      pageNumberLeft.textContent = `— ${currentPage + 1} —`;
      pageNumberRight.textContent = `— ${currentPage + 2 > pages.length ? pages.length : currentPage + 2} —`;
      
      if (isTyping) {
        hintMsg.innerHTML = '<span>✧</span> writing ... <span>✧</span>';
      } else {
        hintMsg.innerHTML = '<span>✧</span> swipe or tap to continue <span>✧</span>';
      }
      if (swipeHint) swipeHint.style.opacity = '1';
    }
    renderDots();
  }

  // Cancel typing animation
  function cancelTyping() {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    isTyping = false;
  }

  // Typewriter effect
  function typeWriter(pageText) {
    cancelTyping();
    isTyping = true;
    typingIndex = 0;
    storyText.style.opacity = '0.95';
    storyText.innerHTML = '';
    
    function typeNextChar() {
      if (typingIndex < pageText.length) {
        storyText.innerHTML += pageText.charAt(typingIndex);
        typingIndex++;
        typingTimer = setTimeout(typeNextChar, 38);
      } else {
        isTyping = false;
        updateUI();
        storyText.style.opacity = '1';
        typingTimer = null;
      }
    }
    typeNextChar();
    updateUI();
  }

  // Display current page
  function displayPage() {
    if (isFinal) {
      storyText.innerHTML = finalMessage;
      storyText.style.opacity = '1';
      cancelTyping();
      isTyping = false;
      nextBtn.textContent = 'with love ✨';
      hintMsg.innerHTML = '<span>💛</span> with all our hearts <span>💛</span>';
      pageNumberLeft.textContent = '— fin —';
      pageNumberRight.textContent = '— fin —';
      document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
      if (swipeHint) swipeHint.style.opacity = '0';
      return;
    }
    
    typeWriter(pages[currentPage]);
  }

  // Advance story (tap/button)
  function advanceStory() {
    if (isFlipping || isDragging) return;
    
    if (isTyping) {
      cancelTyping();
      if (!isFinal) {
        storyText.innerHTML = pages[currentPage];
      }
      isTyping = false;
      updateUI();
      return;
    }

    if (isFinal) {
      return;
    }

    completePageTurn();
  }

  // Start story
  function startStory() {
    welcome.classList.add('hidden');
    bookContainer.classList.remove('hidden');
    currentPage = 0;
    isFinal = false;
    cancelTyping();
    displayPage();
    renderDots();
    pageNumberLeft.textContent = '— 1 —';
    pageNumberRight.textContent = '— 2 —';
    if (swipeHint) swipeHint.style.opacity = '1';
    
    // Attach swipe listeners to book element
    const book = document.querySelector('.book');
    book.addEventListener('touchstart', handleDragStart, { passive: false });
    book.addEventListener('touchmove', handleDragMove, { passive: false });
    book.addEventListener('touchend', handleDragEnd);
    book.addEventListener('touchcancel', handleDragEnd);
  }

  // Event listeners
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    advanceStory();
  });

  nextBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowRight') && welcome.classList.contains('hidden')) {
      if (!bookContainer.classList.contains('hidden')) {
        e.preventDefault();
        advanceStory();
      }
    }
  });

  // Click/tap on book to advance
  const book = document.querySelector('.book');
  book.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('.sound-toggle')) {
      advanceStory();
    }
  });

  // Start button
  document.getElementById('startBtn').addEventListener('click', startStory);
  document.getElementById('startBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });

  // Click on welcome card to start
  welcome.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      startStory();
    }
  });

  // Double-tap to restart
  book.addEventListener('dblclick', () => {
    if (isFinal) {
      isFinal = false;
      currentPage = 0;
      bookContainer.classList.add('hidden');
      welcome.classList.remove('hidden');
      cancelTyping();
      pageRight.style.transform = 'rotateY(0deg)';
    }
  });

  // Starfield animation
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d', { alpha: true });
  let width, height;
  let stars = [];
  let animationFrame = null;
  
  function initStars(count = 130) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        radius: Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.6 + 0.25,
        speed: 0.0008 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function drawStars() {
    if (!canvas.isConnected) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const time = Date.now() * 0.001;
    
    stars.forEach(s => {
      const twinkle = Math.sin(time * s.speed * 3 + s.phase) * 0.18 + 0.82;
      let alpha = Math.min(s.alpha * twinkle, 1.0);
      
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.radius, 0, Math.PI * 2);
      
      const gradient = ctx.createRadialGradient(
        s.x * width, s.y * height, 0,
        s.x * width, s.y * height, s.radius * 2.5
      );
      gradient.addColorStop(0, `rgba(255, 250, 230, ${alpha})`);
      gradient.addColorStop(1, `rgba(220, 235, 255, ${alpha * 0.3})`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    });
    
    animationFrame = requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 50));
  
  initStars(110);
  resizeCanvas();
  animationFrame = requestAnimationFrame(drawStars);
  
  // Pause animation when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    } else {
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(drawStars);
      }
    }
  });
  
  renderDots();
  
  // iOS viewport height fix
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => setTimeout(setVH, 50));

  // Preload audio on first user interaction
  let audioPreloaded = false;
  document.body.addEventListener('touchstart', () => {
    if (!audioPreloaded && lullabyAudio) {
      lullabyAudio.load();
      audioPreloaded = true;
    }
  }, { once: true, passive: true });
  
})();