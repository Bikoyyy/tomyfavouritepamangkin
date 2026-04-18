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
  const startBtn = document.getElementById('startBtn');

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

  // Audio setup - CRITICAL for mobile
  if (lullabyAudio) {
    lullabyAudio.volume = 0.25;
    lullabyAudio.loop = true;
    lullabyAudio.playsInline = true;
    lullabyAudio.preload = 'metadata';
    
    // Mark as initialized
    audioInitialized = true;
    
    lullabyAudio.addEventListener('canplaythrough', () => {
      loadingIndicator.classList.remove('show');
      soundText.textContent = 'play lullaby';
    });

    lullabyAudio.addEventListener('error', (e) => {
      console.log('Audio error:', e);
      loadingIndicator.classList.remove('show');
      soundIcon.textContent = '🎵';
      soundText.textContent = 'tap to play';
    });
  }

  // Toggle sound - Fixed for mobile
  function toggleSound(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!lullabyAudio) return;
    
    if (isPlaying) {
      lullabyAudio.pause();
      soundIcon.textContent = '🎵';
      soundText.textContent = 'play lullaby';
      isPlaying = false;
    } else {
      // For mobile, we need to load and play
      lullabyAudio.load();
      const playPromise = lullabyAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          soundIcon.textContent = '🎵';
          soundText.textContent = 'lullaby playing';
          isPlaying = true;
        }).catch(error => {
          console.log('Play failed:', error);
          soundIcon.textContent = '🎵';
          soundText.textContent = 'tap to try again';
          isPlaying = false;
        });
      }
    }
  }

  // Attach sound toggle with multiple event types for mobile
  if (soundToggle) {
    soundToggle.addEventListener('click', toggleSound);
    soundToggle.addEventListener('touchstart', function(e) {
      e.preventDefault();
    }, { passive: true });
  }

  // Page flip sound effect
  function playPageFlipSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Resume context if suspended (important for mobile)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
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

  // Complete page turn
  function completePageTurn() {
    if (isFlipping) return;
    isFlipping = true;
    
    playPageFlipSound();
    
    pageRight.style.transform = 'rotateY(-172deg)';
    
    setTimeout(() => {
      if (currentPage < pages.length - 1) {
        currentPage++;
        displayPage();
      } else if (!isFinal) {
        isFinal = true;
        displayPage();
      }
      
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

  // Advance story
  function advanceStory(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
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

    if (isFinal) return;
    
    completePageTurn();
  }

  // Render progress dots
  function renderDots() {
    let dotsHtml = '';
    for (let i = 0; i < pages.length; i++) {
      dotsHtml += `<span class="dot ${i === currentPage ? 'active' : ''}"></span>`;
    }
    progressDots.innerHTML = dotsHtml;
  }

  // Update UI
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
        hintMsg.innerHTML = '<span>✧</span> tap to continue <span>✧</span>';
      }
      if (swipeHint) swipeHint.style.opacity = '1';
    }
    renderDots();
  }

  // Cancel typing
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

  // Display page
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

  // Start story - Fixed for mobile
  function startStory(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
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
  }

  // Swipe handlers
  function handleDragStart(e) {
    if (isFlipping || isTyping || isFinal) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const bookRect = pageRight.getBoundingClientRect();
    const touchX = touch.clientX;
    
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
    if (!touch) return;
    
    currentX = touch.clientX;
    
    const deltaX = startX - currentX;
    dragProgress = Math.max(0, Math.min(1, deltaX / 200));
    
    const rotation = dragProgress * 172;
    pageRight.style.transform = `rotateY(-${rotation}deg)`;
    
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
      completePageTurn();
    } else {
      pageRight.style.transform = 'rotateY(0deg)';
      setTimeout(() => {
        pageRight.style.transition = '';
      }, 400);
    }
    
    e.preventDefault();
  }

  // Attach event listeners with mobile support
  function attachEvents() {
    // Start button
    if (startBtn) {
      startBtn.addEventListener('click', startStory);
      startBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startStory(e);
      }, { passive: false });
    }

    // Welcome card tap
    if (welcome) {
      welcome.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') {
          startStory(e);
        }
      });
      welcome.addEventListener('touchstart', function(e) {
        if (e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          startStory(e);
        }
      }, { passive: false });
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', advanceStory);
      nextBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        advanceStory(e);
      }, { passive: false });
    }

    // Book container - main interaction area
    const book = document.querySelector('.book');
    if (book) {
      book.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('.sound-toggle')) {
          advanceStory(e);
        }
      });
      
      book.addEventListener('touchstart', function(e) {
        // Let the swipe handlers manage this
        const touch = e.touches[0];
        if (!touch) return;
        
        const bookRect = pageRight.getBoundingClientRect();
        const touchX = touch.clientX;
        
        // If touching right edge, let swipe handle it
        if (touchX >= bookRect.right - EDGE_WIDTH) {
          handleDragStart(e);
        }
      }, { passive: false });
      
      book.addEventListener('touchmove', handleDragMove, { passive: false });
      book.addEventListener('touchend', handleDragEnd);
      book.addEventListener('touchcancel', handleDragEnd);
    }

    // Keyboard navigation (desktop)
    document.addEventListener('keydown', function(e) {
      if ((e.code === 'Space' || e.code === 'ArrowRight') && welcome.classList.contains('hidden')) {
        if (!bookContainer.classList.contains('hidden')) {
          e.preventDefault();
          advanceStory();
        }
      }
    });

    // Double-tap to restart
    if (book) {
      book.addEventListener('dblclick', function() {
        if (isFinal) {
          isFinal = false;
          currentPage = 0;
          bookContainer.classList.add('hidden');
          welcome.classList.remove('hidden');
          cancelTyping();
          pageRight.style.transform = 'rotateY(0deg)';
        }
      });
    }
  }

  // Starfield animation
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d', { alpha: true });
  let width, height;
  let stars = [];
  let animationFrame = null;
  
  function initStars(count) {
    count = count || 110;
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
    
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
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
    }
    
    animationFrame = requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', function() {
    setTimeout(resizeCanvas, 50);
  });
  
  initStars(110);
  resizeCanvas();
  animationFrame = requestAnimationFrame(drawStars);
  
  document.addEventListener('visibilitychange', function() {
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
  
  // iOS viewport height fix
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', function() {
    setTimeout(setVH, 50);
  });

  // Initialize everything
  renderDots();
  attachEvents();
  
  // Ensure audio can be played on mobile
  document.body.addEventListener('touchstart', function() {
    if (lullabyAudio && lullabyAudio.paused && !isPlaying) {
      // Just load it, don't autoplay
      lullabyAudio.load();
    }
  }, { once: true, passive: true });
  
})();
