// src/services/soundService.js
import { Audio } from "expo-av";

class SoundService {
  constructor() {
    this.sounds = {};
    this.initialized = false;
    this.rideRequestTimeout = null;
  }

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await this.loadSounds();
      this.initialized = true;
      console.log("✅ SoundService initialized");
    } catch (error) {
      console.error("❌ Error initializing SoundService:", error);
    }
  }

  async loadSounds() {
    try {
      const { sound: rideRequestSound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/new_request.mp3"),
        { volume: 1.0, shouldPlay: false }
      );
      this.sounds.rideRequest = rideRequestSound;

      const { sound: onlineSound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/online.mp3"),
        { volume: 0.7, shouldPlay: false }
      );
      this.sounds.online = onlineSound;

      const { sound: offlineSound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/offline.mp3"),
        { volume: 0.7, shouldPlay: false }
      );
      this.sounds.offline = offlineSound;

      const { sound: acceptedSound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/ride-accepted.mp3"),
        { volume: 0.8, shouldPlay: false }
      );
      this.sounds.accepted = acceptedSound;

      const { sound: completedSound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/ride-completed.mp3"),
        { volume: 0.8, shouldPlay: false }
      );
      this.sounds.completed = completedSound;
    } catch (error) {
      console.warn("⚠️ Some sounds could not be loaded:", error);
    }
  }

  async playRideRequestSound() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const sound = this.sounds.rideRequest;
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.setIsLoopingAsync(true);
        await sound.setVolumeAsync(1.0);
        await sound.playAsync();

        console.log("🔊 Playing ride request sound (LOOPING for 5 min)");

        this.rideRequestTimeout = setTimeout(() => {
          this.stopRideRequestSound();
          console.log("⏱️ Ride request sound stopped after 5 minutes");
        }, 300000);
      }
    } catch (error) {
      console.error("Error playing ride request sound:", error);
    }
  }

  async stopRideRequestSound() {
    try {
      const sound = this.sounds.rideRequest;
      if (sound) {
        await sound.stopAsync();
        await sound.setIsLoopingAsync(false);
        await sound.setPositionAsync(0);
        console.log("🔇 Ride request sound stopped");
      }

      if (this.rideRequestTimeout) {
        clearTimeout(this.rideRequestTimeout);
        this.rideRequestTimeout = null;
      }
    } catch (error) {
      console.error("Error stopping ride request sound:", error);
    }
  }

  async playOnlineSound() {
    try {
      const sound = this.sounds.online;
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing online sound:", error);
    }
  }

  async playOfflineSound() {
    try {
      const sound = this.sounds.offline;
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing offline sound:", error);
    }
  }

  async playAcceptedSound() {
    try {
      const sound = this.sounds.accepted;
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing accepted sound:", error);
    }
  }

  async playCompletedSound() {
    try {
      const sound = this.sounds.completed;
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing completed sound:", error);
    }
  }

  async cleanup() {
    try {
      await this.stopRideRequestSound();

      for (const key in this.sounds) {
        if (this.sounds[key]) {
          await this.sounds[key].unloadAsync();
        }
      }
      this.sounds = {};
      this.initialized = false;
    } catch (error) {
      console.error("Error cleaning up sounds:", error);
    }
  }
}

export default new SoundService();
