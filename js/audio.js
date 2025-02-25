class AudioManager {
    constructor() {
        // Configuration des sons
        this.soundConfigs = {
            move: { frequency: 200, duration: 0.1, type: 'sine' },
            rotate: { frequency: 400, duration: 0.1, type: 'square' },
            drop: { frequency: 300, duration: 0.15, type: 'triangle' },
            clear: { frequency: 600, duration: 0.2, type: 'sine' },
            levelUp: { frequency: [400, 600, 800], duration: 0.3, type: 'sine' },
            gameOver: { frequency: [200, 150, 100], duration: 0.5, type: 'sine' }
        };

        // Notes de la mélodie de Tetris (thème A)
        this.tetrisMelody = [
            { note: 'E5', duration: 0.25 }, { note: 'B4', duration: 0.125 }, 
            { note: 'C5', duration: 0.125 }, { note: 'D5', duration: 0.25 }, 
            { note: 'C5', duration: 0.125 }, { note: 'B4', duration: 0.125 },
            { note: 'A4', duration: 0.25 }, { note: 'A4', duration: 0.125 }, 
            { note: 'C5', duration: 0.125 }, { note: 'E5', duration: 0.25 }, 
            { note: 'D5', duration: 0.125 }, { note: 'C5', duration: 0.125 },
            { note: 'B4', duration: 0.375 }, { note: 'C5', duration: 0.125 },
            { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
            { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.25 },
            { note: 'A4', duration: 0.25 }, { note: 'rest', duration: 0.25 }
        ];

        // Fréquences des notes
        this.noteFrequencies = {
            'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
            'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99
        };

        // État
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.soundVolume = 0.3;
        this.musicVolume = 0.4;
        this.audioContext = null;
        this.currentNoteIndex = 0;
        this.musicLoop = null;
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    playNote(noteInfo, time = 0) {
        if (this.isMuted || !noteInfo) return;

        const ctx = this.initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        
        // Si c'est une pause, pas de son
        if (noteInfo.note !== 'rest') {
            oscillator.frequency.value = this.noteFrequencies[noteInfo.note];
            gainNode.gain.setValueAtTime(this.musicVolume * 0.5, ctx.currentTime + time);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + time + noteInfo.duration);
        }

        oscillator.start(ctx.currentTime + time);
        oscillator.stop(ctx.currentTime + time + noteInfo.duration);

        return noteInfo.duration;
    }

    playMelody() {
        if (this.isMuted || !this.isMusicPlaying) return;

        let currentTime = 0;
        this.tetrisMelody.forEach(noteInfo => {
            this.playNote(noteInfo, currentTime);
            currentTime += noteInfo.duration;
        });

        // Programmer la prochaine répétition
        this.musicLoop = setTimeout(() => {
            if (this.isMusicPlaying) {
                this.playMelody();
            }
        }, currentTime * 1000);
    }

    toggleMusic() {
        this.isMusicPlaying = !this.isMusicPlaying;
        
        if (this.isMusicPlaying) {
            this.initAudioContext();
            this.playMelody();
        } else {
            if (this.musicLoop) {
                clearTimeout(this.musicLoop);
                this.musicLoop = null;
            }
        }
    }

    playSound(name) {
        if (this.isMuted || !this.soundConfigs[name]) return;

        try {
            this.initAudioContext();
            
            const config = this.soundConfigs[name];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = config.type;
            oscillator.frequency.value = Array.isArray(config.frequency) ? config.frequency[0] : config.frequency;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.soundVolume, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + config.duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);

        } catch (error) {
            console.warn('Erreur lors de la lecture du son:', error);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMusicPlaying && this.isMuted) {
            this.toggleMusic();
        }
    }

    setVolume(type, value) {
        const normalizedValue = Math.max(0, Math.min(1, value));
        if (type === 'sound') {
            this.soundVolume = normalizedValue;
        } else if (type === 'music') {
            this.musicVolume = normalizedValue;
        }
    }

    stopAll() {
        if (this.musicLoop) {
            clearTimeout(this.musicLoop);
            this.musicLoop = null;
        }
        this.isMusicPlaying = false;
    }
} 