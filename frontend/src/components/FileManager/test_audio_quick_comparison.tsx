import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

interface AudioTestProps {
  audioUrl: string;
  fileName: string;
}

const AudioTestComparison: React.FC<AudioTestProps> = ({ audioUrl, fileName }) => {
  const [currentTest, setCurrentTest] = useState<'react-player' | 'html5' | 'comparison'>('comparison');
  const [reactPlayerError, setReactPlayerError] = useState<string | null>(null);
  const [html5Error, setHtml5Error] = useState<string | null>(null);
  const [reactPlayerReady, setReactPlayerReady] = useState(false);
  const [html5Ready, setHtml5Ready] = useState(false);
  
  const html5AudioRef = useRef<HTMLAudioElement>(null);
  const [html5Playing, setHtml5Playing] = useState(false);
  const [reactPlayerPlaying, setReactPlayerPlaying] = useState(false);

  const testResults = {
    reactPlayer: {
      loading: !reactPlayerReady,
      error: reactPlayerError,
      working: reactPlayerReady && !reactPlayerError,
      features: ['Contrôles intégrés', 'Gestion d\'erreurs', 'Multi-format', 'Streaming']
    },
    html5: {
      loading: !html5Ready,
      error: html5Error,
      working: html5Ready && !html5Error,
      features: ['Natif', 'Performance', 'Contrôle total', 'Web Audio API']
    }
  };

  const handleReactPlayerReady = () => {
    console.log('✅ React Player prêt');
    setReactPlayerReady(true);
    setReactPlayerError(null);
  };

  const handleReactPlayerError = (error: any) => {
    console.error('❌ Erreur React Player:', error);
    setReactPlayerError(error?.message || 'Erreur inconnue');
  };

  const handleHtml5CanPlay = () => {
    console.log('✅ HTML5 Audio prêt');
    setHtml5Ready(true);
    setHtml5Error(null);
  };

  const handleHtml5Error = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('❌ Erreur HTML5 Audio:', e);
    setHtml5Error('Erreur de chargement HTML5');
  };

  const toggleHtml5Play = () => {
    if (html5AudioRef.current) {
      if (html5Playing) {
        html5AudioRef.current.pause();
      } else {
        html5AudioRef.current.play();
      }
      setHtml5Playing(!html5Playing);
    }
  };

  const getStatusIcon = (working: boolean, loading: boolean, error: string | null) => {
    if (loading) return '⏳';
    if (error) return '❌';
    if (working) return '✅';
    return '❓';
  };

  const getStatusColor = (working: boolean, loading: boolean, error: string | null) => {
    if (loading) return 'text-yellow-500';
    if (error) return 'text-red-500';
    if (working) return 'text-green-500';
    return 'text-gray-500';
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">🎵 Test Comparaison Audio</h2>
      <p className="text-slate-300 mb-4">Fichier: {fileName}</p>
      
      {/* Sélecteur de test */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setCurrentTest('comparison')}
          className={`px-4 py-2 rounded ${currentTest === 'comparison' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          Comparaison
        </button>
        <button
          onClick={() => setCurrentTest('react-player')}
          className={`px-4 py-2 rounded ${currentTest === 'react-player' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          React Player
        </button>
        <button
          onClick={() => setCurrentTest('html5')}
          className={`px-4 py-2 rounded ${currentTest === 'html5' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          HTML5 Audio
        </button>
      </div>

      {/* Vue de comparaison */}
      {currentTest === 'comparison' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* React Player */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <span className="mr-2">🎵</span>
              React Player
              <span className={`ml-2 text-lg ${getStatusColor(testResults.reactPlayer.working, testResults.reactPlayer.loading, testResults.reactPlayer.error)}`}>
                {getStatusIcon(testResults.reactPlayer.working, testResults.reactPlayer.loading, testResults.reactPlayer.error)}
              </span>
            </h3>
            
            <div className="mb-4">
              <ReactPlayer
                url={audioUrl}
                width="100%"
                height="50px"
                controls={true}
                onReady={handleReactPlayerReady}
                onError={handleReactPlayerError}
                config={{
                  file: {
                    attributes: {
                      crossOrigin: "anonymous"
                    }
                  }
                }}
              />
            </div>

            <div className="text-sm text-slate-300">
              <h4 className="font-semibold mb-2">Fonctionnalités:</h4>
              <ul className="space-y-1">
                {testResults.reactPlayer.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {reactPlayerError && (
              <div className="mt-3 p-2 bg-red-900 text-red-200 rounded text-sm">
                Erreur: {reactPlayerError}
              </div>
            )}
          </div>

          {/* HTML5 Audio */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <span className="mr-2">🎵</span>
              HTML5 Audio
              <span className={`ml-2 text-lg ${getStatusColor(testResults.html5.working, testResults.html5.loading, testResults.html5.error)}`}>
                {getStatusIcon(testResults.html5.working, testResults.html5.loading, testResults.html5.error)}
              </span>
            </h3>
            
            <div className="mb-4">
              <audio
                ref={html5AudioRef}
                src={audioUrl}
                controls
                onCanPlay={handleHtml5CanPlay}
                onError={handleHtml5Error}
                crossOrigin="anonymous"
                className="w-full"
              />
            </div>

            <div className="text-sm text-slate-300">
              <h4 className="font-semibold mb-2">Fonctionnalités:</h4>
              <ul className="space-y-1">
                {testResults.html5.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {html5Error && (
              <div className="mt-3 p-2 bg-red-900 text-red-200 rounded text-sm">
                Erreur: {html5Error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vue React Player uniquement */}
      {currentTest === 'react-player' && (
        <div className="bg-slate-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">React Player - Test Complet</h3>
          <ReactPlayer
            url={audioUrl}
            width="100%"
            height="100px"
            controls={true}
            onReady={handleReactPlayerReady}
            onError={handleReactPlayerError}
            onPlay={() => setReactPlayerPlaying(true)}
            onPause={() => setReactPlayerPlaying(false)}
            config={{
              file: {
                attributes: {
                  crossOrigin: "anonymous"
                }
              }
            }}
          />
          
          <div className="mt-4 text-sm text-slate-300">
            <p>Status: {reactPlayerReady ? 'Prêt' : 'Chargement...'}</p>
            <p>Lecture: {reactPlayerPlaying ? 'En cours' : 'Pause'}</p>
            {reactPlayerError && <p className="text-red-400">Erreur: {reactPlayerError}</p>}
          </div>
        </div>
      )}

      {/* Vue HTML5 uniquement */}
      {currentTest === 'html5' && (
        <div className="bg-slate-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">HTML5 Audio - Test Complet</h3>
          <audio
            ref={html5AudioRef}
            src={audioUrl}
            controls
            onCanPlay={handleHtml5CanPlay}
            onError={handleHtml5Error}
            onPlay={() => setHtml5Playing(true)}
            onPause={() => setHtml5Playing(false)}
            crossOrigin="anonymous"
            className="w-full"
          />
          
          <div className="mt-4 text-sm text-slate-300">
            <p>Status: {html5Ready ? 'Prêt' : 'Chargement...'}</p>
            <p>Lecture: {html5Playing ? 'En cours' : 'Pause'}</p>
            {html5Error && <p className="text-red-400">Erreur: {html5Error}</p>}
          </div>
        </div>
      )}

      {/* Résumé des résultats */}
      <div className="mt-6 p-4 bg-slate-900 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">📊 Résultats du Test</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">React Player:</h4>
            <div className="space-y-1 text-sm">
              <p>Status: {testResults.reactPlayer.working ? '✅ Fonctionne' : testResults.reactPlayer.loading ? '⏳ Chargement' : '❌ Erreur'}</p>
              <p>Erreur: {reactPlayerError || 'Aucune'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">HTML5 Audio:</h4>
            <div className="space-y-1 text-sm">
              <p>Status: {testResults.html5.working ? '✅ Fonctionne' : testResults.html5.loading ? '⏳ Chargement' : '❌ Erreur'}</p>
              <p>Erreur: {html5Error || 'Aucune'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-900 text-blue-200 rounded">
          <h4 className="font-semibold mb-2">💡 Recommandation:</h4>
          {testResults.reactPlayer.working && testResults.html5.working ? (
            <p>Les deux solutions fonctionnent ! React Player offre plus de fonctionnalités, HTML5 Audio est plus léger.</p>
          ) : testResults.reactPlayer.working ? (
            <p>React Player fonctionne parfaitement. Utilisez cette solution.</p>
          ) : testResults.html5.working ? (
            <p>HTML5 Audio fonctionne. Gardez l'implémentation actuelle.</p>
          ) : (
            <p>Aucune solution ne fonctionne. Vérifiez l'URL audio et la configuration.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioTestComparison; 