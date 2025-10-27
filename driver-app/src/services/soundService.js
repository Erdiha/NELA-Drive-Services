// services/soundService.js
// Handles notification sounds for online/offline toggle
// Works without expo-av installed (graceful fallback)

class SoundService {
  constructor() {
    this.sounds = {};
    this.isInitialized = false;
    this.audioAvailable = false;
  }

  async initialize() {
    console.log(
      "🔇 Sound Service: Running in silent mode (sound files not added yet)"
    );
    this.isInitialized = true;
  }

  async playOnlineSound() {
    console.log("🔔 [Sound] ONLINE chime");
    // TODO: Add sound files to ../assets/sounds/online.mp3
  }

  async playOfflineSound() {
    console.log("🔕 [Sound] OFFLINE beep");
    // TODO: Add sound files to ../assets/sounds/offline.mp3
  }

  async playTickSound() {
    // Silent for now
  }

  async playRideRequestSound() {
    console.log("🔔 [Sound] NEW RIDE REQUEST");
    // TODO: Add sound files to ../assets/sounds/ride-request.mp3
  }

  async cleanup() {
    Object.values(this.sounds).forEach(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
        // Ignore
      }
    });
  }
}

export default new SoundService();
