// Script de diagnostic pour le MediaPlayer
console.log('🔍 DIAGNOSTIC MEDIAPLAYER - Démarrage');

// 1. Vérification de l'environnement
console.log('\n📋 ENVIRONNEMENT:');
console.log('URL actuelle:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('Support vidéo HTML5:', !!document.createElement('video').canPlayType);

// 2. Test de détection des éléments vidéo
console.log('\n📋 DÉTECTION ÉLÉMENTS:');
const videoElements = document.querySelectorAll('video');
console.log('Éléments vidéo trouvés:', videoElements.length);

videoElements.forEach((video, index) => {
  console.log(`Vidéo ${index + 1}:`, {
    src: video.src,
    currentSrc: video.currentSrc,
    readyState: video.readyState,
    networkState: video.networkState,
    paused: video.paused,
    ended: video.ended,
    muted: video.muted,
    volume: video.volume,
    controls: video.controls,
    autoplay: video.autoplay,
    loop: video.loop,
    width: video.width,
    height: video.height
  });
});

// 3. Test de détection ReactPlayer
console.log('\n📋 DÉTECTION REACTPLAYER:');
const reactPlayerElements = document.querySelectorAll('[data-testid="react-player"]');
console.log('Éléments ReactPlayer trouvés:', reactPlayerElements.length);

// 4. Test des contrôles
console.log('\n📋 TEST CONTRÔLES:');
const controlsElements = document.querySelectorAll('.controls, [class*="control"], [class*="player"]');
console.log('Éléments de contrôles trouvés:', controlsElements.length);

// 5. Test des événements
console.log('\n📋 TEST ÉVÉNEMENTS:');
function testVideoEvents() {
  const video = document.querySelector('video');
  if (video) {
    console.log('✅ Élément vidéo trouvé, test des événements...');
    
    const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'pause', 'ended', 'error'];
    
    events.forEach(event => {
      video.addEventListener(event, (e) => {
        console.log(`📡 Événement ${event} déclenché:`, e);
      });
    });
    
    console.log('✅ Écouteurs d\'événements ajoutés');
  } else {
    console.log('❌ Aucun élément vidéo trouvé');
  }
}

// 6. Test des fonctions de contrôle
console.log('\n📋 TEST FONCTIONS:');
function testControlFunctions() {
  const video = document.querySelector('video');
  if (video) {
    console.log('Test play():', typeof video.play);
    console.log('Test pause():', typeof video.pause);
    console.log('Test volume:', video.volume);
    console.log('Test muted:', video.muted);
    console.log('Test paused:', video.paused);
  }
}

// 7. Test de simulation des clics
console.log('\n📋 TEST CLICS:');
function simulateClicks() {
  console.log('Simulation de clics sur les contrôles...');
  
  // Chercher les boutons de contrôle
  const playButtons = document.querySelectorAll('button[title*="play"], button[title*="Play"], [class*="play"]');
  const pauseButtons = document.querySelectorAll('button[title*="pause"], button[title*="Pause"], [class*="pause"]');
  
  console.log('Boutons play trouvés:', playButtons.length);
  console.log('Boutons pause trouvés:', pauseButtons.length);
  
  playButtons.forEach((btn, index) => {
    console.log(`Bouton play ${index + 1}:`, {
      text: btn.textContent,
      title: btn.title,
      className: btn.className,
      onclick: !!btn.onclick
    });
  });
}

// 8. Test de l'état du lecteur
console.log('\n📋 ÉTAT LECTEUR:');
function checkPlayerState() {
  const video = document.querySelector('video');
  if (video) {
    console.log('État actuel du lecteur:', {
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
      ended: video.ended,
      muted: video.muted,
      volume: video.volume,
      currentTime: video.currentTime,
      duration: video.duration,
      src: video.src,
      error: video.error
    });
  }
}

// Exécution des tests
console.log('\n🚀 EXÉCUTION DES TESTS:');
testVideoEvents();
testControlFunctions();
simulateClicks();
checkPlayerState();

// Fonction pour relancer les tests
window.debugMediaPlayer = function() {
  console.log('\n🔄 RELANCE DU DIAGNOSTIC:');
  testVideoEvents();
  testControlFunctions();
  simulateClicks();
  checkPlayerState();
};

console.log('\n✅ DIAGNOSTIC TERMINÉ');
console.log('💡 Utilisez debugMediaPlayer() pour relancer les tests');
console.log('💡 Ouvrez la console pour voir les résultats détaillés'); 