<!DOCTYPE html>
<html>
<head>
  <style>
    .deck {
      position: relative;
      width: 200px;
      height: 280px;
      margin: 50px auto;
    }

    .card {
      position: absolute;
      width: 80px;
      height: 112px;
      background: #e8e8e8;
      border: 2px solid #333;
      border-radius: 4px;
      image-rendering: pixelated;
      z-index: 2;
      transition: left 0s;
    }

    /* Tight stack state (default) */
    .card:nth-child(1) { left: 0; }
    .card:nth-child(2) { left: 1px; }
    .card:nth-child(3) { left: 2px; }
    .card:nth-child(4) { left: 3px; }

    /* Spread state */
    .deck.spread .card:nth-child(1) { left: -12px; }
    .deck.spread .card:nth-child(2) { left: -4px; }
    .deck.spread .card:nth-child(3) { left: 4px; }
    .deck.spread .card:nth-child(4) { left: 12px; }

    /* Animation card */
    .moving-card {
      position: absolute;
      width: 80px;
      height: 112px;
      background: #e8e8e8;
      border: 2px solid #333;
      border-radius: 4px;
      image-rendering: pixelated;
      left: 12px;
      display: none;
      z-index: 1;
    }

    .moving-card.animated {
      display: block;
      animation: retroShuffle 0.6s steps(1) 4;
    }

    @keyframes retroShuffle {
      0%, 100% {
        transform: translateY(0);
      }
      25% {
        transform: translateY(-40px);
      }
      50% {
        transform: translateY(0);
      }
    }

    .card::after, .moving-card::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      background: 
        repeating-linear-gradient(
          0deg,
          #555 0px,
          #555 4px,
          transparent 4px,
          transparent 8px
        );
    }

    .restart-btn {
      display: block;
      margin: 20px auto;
      padding: 8px 16px;
      font-family: monospace;
      font-size: 16px;
      background: #333;
      color: #fff;
      border: 2px solid #555;
      border-radius: 4px;
      cursor: pointer;
    }

    .restart-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="deck">
    <div class="card"></div>
    <div class="card"></div>
    <div class="card"></div>
    <div class="card"></div>
    <div class="moving-card"></div>
  </div>
  <button class="restart-btn">SHUFFLE</button>

  <script>
    const deck = document.querySelector('.deck');
    const movingCard = document.querySelector('.moving-card');
    const restartBtn = document.querySelector('.restart-btn');
    
    function shuffle() {
      restartBtn.disabled = true;
      
      // Step 1: Instantly spread
      deck.classList.add('spread');
      
      // Step 2: Start animation
      setTimeout(() => {
        movingCard.classList.add('animated');
      }, 50);
      
      // Step 3: Reset everything
      setTimeout(() => {
        movingCard.classList.remove('animated');
        deck.classList.remove('spread');
        restartBtn.disabled = false;
      }, 2450); // Animation duration (2400) + small buffer
    }
    
    restartBtn.addEventListener('click', shuffle);
  </script>
</body>
</html>