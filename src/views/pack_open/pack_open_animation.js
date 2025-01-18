const CONFIG = {
    shakeDuration: 500,
    flashDuration: 400,
    slideDuration: 800,
    fadeDuration: 600,
    
    delayAfterShake: 400,
    delayAfterFlash: 600,
    delayAfterSlide: 1000
  };
  
  let isAnimating = false;
  let timeouts = [];
  
  function clearAllTimeouts() {
    timeouts.forEach(timeout => clearTimeout(timeout));
    timeouts = [];
  }
  
  function startAnimation() {
    if (isAnimating) return;
    
    isAnimating = true;
    const container = document.querySelector('.pack-container');
    const packMain = document.querySelector('.pack-main');
    const packLid = document.querySelector('.pack-lid');
    const flash = document.querySelector('.flash');
    const resetBtn = document.querySelector('.reset-button');
    
    container.classList.add('animating');
    resetBtn.disabled = true;
    
    // Phase 1: Shake
    packMain.classList.add('shake');
    packLid.classList.add('shake');
    
    timeouts.push(setTimeout(() => {
      packMain.classList.remove('shake');
      packLid.classList.remove('shake');
      
      // Phase 2: Flash
      timeouts.push(setTimeout(() => {
        flash.classList.add('flash-effect');
        
        // Phase 3: Slide
        timeouts.push(setTimeout(() => {
          packLid.classList.add('slide-right');
          
          // Phase 4: Fade
          timeouts.push(setTimeout(() => {
            packMain.classList.add('fade-out');
            packLid.classList.add('fade-out');
            
            timeouts.push(setTimeout(() => {
              resetBtn.disabled = false;
            }, CONFIG.fadeDuration));
            
          }, CONFIG.delayAfterSlide));
          
        }, CONFIG.delayAfterFlash));
      }, CONFIG.delayAfterShake));
      
    }, CONFIG.shakeDuration));
  }
  
  function resetPack() {
    clearAllTimeouts();
    
    const container = document.querySelector('.pack-container');
    const packMain = document.querySelector('.pack-main');
    const packLid = document.querySelector('.pack-lid');
    const flash = document.querySelector('.flash');
    const resetBtn = document.querySelector('.reset-button');
    
    container.classList.remove('animating');
    resetBtn.disabled = false;
    
    packMain.classList.remove('shake', 'fade-out');
    packLid.classList.remove('shake', 'slide-right', 'fade-out');
    flash.classList.remove('flash-effect');
    
    void packMain.offsetWidth;
    void packLid.offsetWidth;
    void flash.offsetWidth;
    
    // Reset visibility and transforms
    packMain.style.opacity = '';
    packMain.style.transform = '';
    packLid.style.opacity = '';
    packLid.style.transform = '';
    
    isAnimating = false;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.pack-container').addEventListener('click', startAnimation);
    document.querySelector('.reset-button').addEventListener('click', resetPack);
  });