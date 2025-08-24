/**
 * Service pour l'optimisation multimédia
 */

export interface OptimizationSettings {
  bandwidthControl: 'auto' | 'low' | 'medium' | 'high';
  noiseReduction: boolean;
  voiceEnhancement: boolean;
  audioCompression: boolean;
  videoCompression: boolean;
  frameRate?: number;
}

export interface OptimizationInfo {
  file_id: number;
  file_name: string;
  file_type: string;
  file_size_mb: number;
  ffmpeg_available: boolean;
  optimization_options: {
    bandwidth_control: {
      available: boolean;
      options: string[];
      description: string;
    };
    noise_reduction: {
      available: boolean;
      description: string;
    };
    voice_enhancement: {
      available: boolean;
      description: string;
    };
    audio_compression: {
      available: boolean;
      description: string;
    };
    video_compression?: {
      available: boolean;
      description: string;
    };
    frame_rate?: {
      available: boolean;
      options: number[];
      description: string;
    };
  };
}

export interface FFmpegStatus {
  ffmpeg_available: boolean;
  message: string;
}

class MultimediaService {
  private baseUrl = '/api/multimedia';

  /**
   * Obtient les informations d'optimisation pour un fichier
   */
  async getOptimizationInfo(fileId: number): Promise<OptimizationInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/optimization-info/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw error;
    }
  }

  /**
   * Vérifie le statut de FFmpeg
   */
  async getFFmpegStatus(): Promise<FFmpegStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/ffmpeg-status`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw error;
    }
  }

  /**
   * Optimise un fichier multimédia
   */
  async optimizeFile(fileId: number, settings: OptimizationSettings): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        bandwidth_control: settings.bandwidthControl,
        noise_reduction: settings.noiseReduction.toString(),
        voice_enhancement: settings.voiceEnhancement.toString(),
        audio_compression: settings.audioCompression.toString(),
        video_compression: settings.videoCompression.toString(),
        ...(settings.frameRate && { frame_rate: settings.frameRate.toString() })
      });

      const response = await fetch(`${this.baseUrl}/optimize/${fileId}?${params}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw error;
    }
  }

  /**
   * Obtient l'URL de streaming optimisé
   */
  getOptimizedStreamUrl(fileId: number, settings: OptimizationSettings): string {
    const params = new URLSearchParams({
      bandwidth_control: settings.bandwidthControl,
      noise_reduction: settings.noiseReduction.toString(),
      voice_enhancement: settings.voiceEnhancement.toString(),
      audio_compression: settings.audioCompression.toString(),
      video_compression: settings.videoCompression.toString(),
      ...(settings.frameRate && { frame_rate: settings.frameRate.toString() })
    });

    return `${this.baseUrl}/stream-optimized/${fileId}?${params}`;
  }

  /**
   * Applique les optimisations en temps réel via l'API Web Audio
   */
  applyRealTimeOptimizations(
    audioContext: AudioContext,
    source: MediaElementAudioSourceNode,
    settings: OptimizationSettings
  ): void {
    try {
      // Réduction de bruit
      if (settings.noiseReduction) {
        const lowpassFilter = audioContext.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.value = 8000; // 8kHz
        lowpassFilter.Q.value = 1;
        
        source.connect(lowpassFilter);
        lowpassFilter.connect(audioContext.destination);
      }

      // Amélioration de la voix
      if (settings.voiceEnhancement) {
        const voiceFilter = audioContext.createBiquadFilter();
        voiceFilter.type = 'peaking';
        voiceFilter.frequency.value = 1500; // 1.5kHz
        voiceFilter.Q.value = 2;
        voiceFilter.gain.value = 6; // +6dB
        
        source.connect(voiceFilter);
        voiceFilter.connect(audioContext.destination);
      }

      // Compression audio
      if (settings.audioCompression) {
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        source.connect(compressor);
        compressor.connect(audioContext.destination);
      }

      
    } catch (error) {
      // OPTIMISATION: Suppression des console.warn pour éviter la surcharge
    }
  }

  /**
   * Applique les optimisations vidéo côté client
   */
  applyVideoOptimizations(
    videoElement: HTMLVideoElement,
    settings: OptimizationSettings
  ): void {
    try {
      // Contrôle de la bande passante
      switch (settings.bandwidthControl) {
        case 'low':
          videoElement.preload = 'metadata';
          videoElement.style.filter = 'contrast(0.8) brightness(0.9)';
          break;
        case 'medium':
          videoElement.preload = 'auto';
          break;
        case 'high':
          videoElement.preload = 'auto';
          break;
        default: // auto
          videoElement.preload = 'metadata';
          break;
      }

      // Compression vidéo (effet visuel)
      if (settings.videoCompression) {
        videoElement.style.filter = 'contrast(1.1) brightness(1.05)';
      }

      
    } catch (error) {
      // OPTIMISATION: Suppression des console.warn pour éviter la surcharge
    }
  }

  /**
   * Vérifie si les optimisations sont supportées
   */
  async checkOptimizationSupport(fileId: number): Promise<{
    supported: boolean;
    ffmpegAvailable: boolean;
    optimizationInfo?: OptimizationInfo;
  }> {
    try {
      const [ffmpegStatus, optimizationInfo] = await Promise.all([
        this.getFFmpegStatus(),
        this.getOptimizationInfo(fileId)
      ]);

      return {
        supported: ffmpegStatus.ffmpeg_available,
        ffmpegAvailable: ffmpegStatus.ffmpeg_available,
        optimizationInfo
      };
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      return {
        supported: false,
        ffmpegAvailable: false
      };
    }
  }
}

export const multimediaService = new MultimediaService();
export default multimediaService; 