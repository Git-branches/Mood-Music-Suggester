// Spotify API Configuration
const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
const REDIRECT_URI = 'http://localhost:8000'; // Update if hosted elsewhere
const SCOPES = 'user-read-private';
const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

// State variables
let accessToken = '';
let selectedMood = 'calm';
let selectedWeather = 'sunny';
let selectedTime = 'afternoon';
let intensity = 5;
let darkMode = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Check Spotify authentication
    const hash = window.location.hash;
    if (hash) {
        accessToken = hash.split('&')[0].split('=')[1];
        window.location.hash = '';
        document.getElementById('spotifyLogin').style.display = 'none';
        console.log('Spotify Access Token:', accessToken); // Debug token
    } else {
        document.getElementById('spotifyLogin').style.display = 'block';
        console.log('No Spotify access token found. Please log in.');
    }

    // Load saved theme and mood
    if (localStorage.getItem('theme') === 'true') {
        enableDarkMode();
    }
    loadLastMood();
    autoDetectMood();
    autoDetectWeather();
    createParticles();

    // Setup event listeners
    setupMoodButtons();
    setupWeatherButtons();
    setupTimeButtons();
    setupIntensitySlider();
    setupThemeToggle();
    setupSpotifyLogin();
}

// Spotify login
function setupSpotifyLogin() {
    const loginBtn = document.getElementById('spotifyLogin');
    loginBtn.addEventListener('click', () => {
        console.log('Initiating Spotify login:', SPOTIFY_AUTH_URL);
        window.location = SPOTIFY_AUTH_URL;
    });
}

// Mood selection
function setupMoodButtons() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedMood = this.dataset.mood;
            document.body.className = darkMode ? 'dark-mode mood-' + selectedMood : 'mood-' + selectedMood;
            animateButton(this);
            createParticles();
            saveMood(selectedMood, selectedWeather, selectedTime);
        });
    });
}

// Weather selection
function setupWeatherButtons() {
    document.querySelectorAll('#weatherOptions .option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#weatherOptions .option-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedWeather = this.dataset.weather;
            animateButton(this);
            saveMood(selectedMood, selectedWeather, selectedTime);
        });
    });
}

// Time selection
function setupTimeButtons() {
    document.querySelectorAll('#timeOptions .option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#timeOptions .option-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedTime = this.dataset.time;
            animateButton(this);
            saveMood(selectedMood, selectedWeather, selectedTime);
        });
    });
}

// Intensity slider
function setupIntensitySlider() {
    const slider = document.getElementById('intensitySlider');
    const valueDisplay = document.getElementById('intensityValue');
    
    slider.addEventListener('input', function() {
        intensity = this.value;
        valueDisplay.textContent = intensity;
        valueDisplay.style.transform = 'scale(1.2)';
        setTimeout(() => {
            valueDisplay.style.transform = 'scale(1)';
        }, 200);
    });
}

// Theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', function() {
        darkMode = !darkMode;
        if (darkMode) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
}

function enableDarkMode() {
    darkMode = true;
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'true');
    document.body.className = `dark-mode mood-${selectedMood}`;
}

function disableDarkMode() {
    darkMode = false;
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'false');
    document.body.className = `mood-${selectedMood}`;
}

// Auto-detect time of day
function autoDetectMood() {
    const hour = new Date().getHours();
    document.querySelectorAll('#timeOptions .option-btn').forEach(btn => btn.classList.remove('active'));
    if (hour < 12) {
        selectedTime = 'morning';
        document.querySelector("[data-time='morning']").classList.add('active');
    } else if (hour < 18) {
        selectedTime = 'afternoon';
        document.querySelector("[data-time='afternoon']").classList.add('active');
    } else if (hour < 22) {
        selectedTime = 'evening';
        document.querySelector("[data-time='evening']").classList.add('active');
    } else {
        selectedTime = 'night';
        document.querySelector("[data-time='night']").classList.add('active');
    }
    saveMood(selectedMood, selectedWeather, selectedTime);
}

// Auto-detect weather
function autoDetectWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=YOUR_API_KEY&units=metric`)
                .then(res => res.json())
                .then(data => {
                    const weather = data.weather[0].main.toLowerCase();
                    let mappedWeather = 'sunny';
                    if (weather.includes('rain')) mappedWeather = 'rainy';
                    else if (weather.includes('cloud')) mappedWeather = 'cloudy';
                    else if (weather.includes('snow')) mappedWeather = 'snowy';
                    else if (weather.includes('wind')) mappedWeather = 'windy';

                    document.querySelectorAll('#weatherOptions .option-btn').forEach(btn => btn.classList.remove('active'));
                    const current = document.querySelector(`[data-weather="${mappedWeather}"]`);
                    if (current) {
                        current.classList.add('active');
                        selectedWeather = mappedWeather;
                        saveMood(selectedMood, selectedWeather, selectedTime);
                    }
                })
                .catch(err => console.error('Weather API error:', err));
        }, err => console.error('Geolocation error:', err));
    }
}

// Save mood to localStorage
function saveMood(mood, weather, time) {
    localStorage.setItem('lastMood', JSON.stringify({ mood, weather, time }));
}

// Load last mood from localStorage
function loadLastMood() {
    const saved = JSON.parse(localStorage.getItem('lastMood'));
    if (saved) {
        selectedMood = saved.mood;
        selectedWeather = saved.weather;
        selectedTime = saved.time;
        document.body.className = darkMode ? `dark-mode mood-${saved.mood}` : `mood-${saved.mood}`;
        
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mood="${saved.mood}"]`).classList.add('active');
        
        document.querySelectorAll('#weatherOptions .option-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-weather="${saved.weather}"]`).classList.add('active');
        
        document.querySelectorAll('#timeOptions .option-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-time="${saved.time}"]`).classList.add('active');
    }
}

// Button animation
function animateButton(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    particlesContainer.innerHTML = '';
    const moodIcons = {
        happy: ['😊', '🎉', '⭐', '✨'],
        sad: ['😢', '💧', '☁️'],
        energetic: ['⚡', '🔥', '💥'],
        calm: ['😌', '🌊', '🌙'],
        romantic: ['💕', '🌹', '❤️'],
        focused: ['🎯', '📚', '💡'],
        nostalgic: ['🌅', '📻', '🎞️'],
        adventurous: ['🌍', '🏞️', '🚀']
    };
    const icons = ['🎵', '🎶', ...moodIcons[selectedMood]];
    for (let i = 0; i < 20; i++) {
        const span = document.createElement('span');
        span.classList.add('particle');
        span.textContent = icons[Math.floor(Math.random() * icons.length)];
        span.style.left = Math.random() * 100 + '%';
        span.style.animationDuration = 8 + Math.random() * 10 + 's';
        span.style.fontSize = 16 + Math.random() * 16 + 'px';
        particlesContainer.appendChild(span);
    }
}

// Fetch Spotify track preview with enhanced error logging
async function fetchSpotifyPreview(title, artist) {
    if (!accessToken) {
        console.warn('No Spotify access token. User must log in.');
        return null;
    }
    try {
        console.log(`Fetching Spotify preview for: ${title} by ${artist}`);
        const response = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(title)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Spotify API Error: Status ${response.status}, Message: ${errorText}`);
            return null;
        }
        const data = await response.json();
        const previewUrl = data.tracks.items[0]?.preview_url || null;
        console.log(`Preview URL for ${title}: ${previewUrl || 'Not available'}`);
        return previewUrl;
    } catch (error) {
        console.error('Spotify API fetch error:', error.message);
        return null;
    }
}

// Music database
const musicDatabase = {
    happy: {
        songs: [
            {title: 'Walking on Sunshine', artist: 'Katrina & The Waves', genre: 'Pop'},
            {title: 'Good Vibrations', artist: 'The Beach Boys', genre: 'Rock'},
            {title: 'Happy', artist: 'Pharrell Williams', genre: 'Pop'},
            {title: 'Don\'t Stop Me Now', artist: 'Queen', genre: 'Rock'},
            {title: 'I Gotta Feeling', artist: 'Black Eyed Peas', genre: 'Pop'},
            {title: 'September', artist: 'Earth, Wind & Fire', genre: 'Funk'},
            {title: 'Mr. Blue Sky', artist: 'Electric Light Orchestra', genre: 'Rock'},
            {title: 'Three Little Birds', artist: 'Bob Marley', genre: 'Reggae'}
        ],
        genres: ['Pop', 'Funk', 'Dance', 'Indie Pop'],
        descriptions: ['Pure joy and sunshine', 'Uplifting beats that make you smile', 'Feel-good anthems'],
        quote: 'Keep shining! Every beat is a reason to smile 😊'
    },
    sad: {
        songs: [
            {title: 'Someone Like You', artist: 'Adele', genre: 'Soul'},
            {title: 'Hurt', artist: 'Johnny Cash', genre: 'Country'},
            {title: 'Mad World', artist: 'Gary Jules', genre: 'Alternative'},
            {title: 'The Night We Met', artist: 'Lord Huron', genre: 'Indie Folk'},
            {title: 'Fix You', artist: 'Coldplay', genre: 'Alternative Rock'},
            {title: 'Skinny Love', artist: 'Bon Iver', genre: 'Indie Folk'},
            {title: 'Tears in Heaven', artist: 'Eric Clapton', genre: 'Rock'},
            {title: 'Everybody Hurts', artist: 'R.E.M.', genre: 'Alternative'}
        ],
        genres: ['Ballad', 'Soul', 'Indie', 'Alternative'],
        descriptions: ['Embrace your emotions', 'Melancholic melodies for reflection', 'It\'s okay to feel'],
        quote: 'Even sad songs heal the heart 💙'
    },
    energetic: {
        songs: [
            {title: 'Eye of the Tiger', artist: 'Survivor', genre: 'Rock'},
            {title: 'Till I Collapse', artist: 'Eminem', genre: 'Hip Hop'},
            {title: 'Thunderstruck', artist: 'AC/DC', genre: 'Rock'},
            {title: 'Pump It', artist: 'Black Eyed Peas', genre: 'Hip Hop'},
            {title: 'Levels', artist: 'Avicii', genre: 'EDM'},
            {title: 'Stronger', artist: 'Kanye West', genre: 'Hip Hop'},
            {title: 'We Will Rock You', artist: 'Queen', genre: 'Rock'},
            {title: 'Can\'t Hold Us', artist: 'Macklemore', genre: 'Hip Hop'}
        ],
        genres: ['Rock', 'Hip Hop', 'EDM', 'Electronic'],
        descriptions: ['High-octane energy boost', 'Workout-ready beats', 'Unstoppable momentum'],
        quote: 'Unleash your energy with every beat! ⚡'
    },
    calm: {
        songs: [
            {title: 'Weightless', artist: 'Marconi Union', genre: 'Ambient'},
            {title: 'Clair de Lune', artist: 'Debussy', genre: 'Classical'},
            {title: 'River Flows in You', artist: 'Yiruma', genre: 'Classical'},
            {title: 'Holocene', artist: 'Bon Iver', genre: 'Indie Folk'},
            {title: 'Breathe Me', artist: 'Sia', genre: 'Alternative'},
            {title: 'To Build a Home', artist: 'The Cinematic Orchestra', genre: 'Ambient'},
            {title: 'Spiegel im Spiegel', artist: 'Arvo Pärt', genre: 'Classical'},
            {title: 'Aqueous Transmission', artist: 'Incubus', genre: 'Alternative'}
        ],
        genres: ['Ambient', 'Classical', 'Acoustic', 'Chillout'],
        descriptions: ['Peaceful serenity', 'Gentle waves of tranquility', 'Mindful relaxation'],
        quote: 'Find peace in every note 🎶'
    },
    romantic: {
        songs: [
            {title: 'At Last', artist: 'Etta James', genre: 'Soul'},
            {title: 'Thinking Out Loud', artist: 'Ed Sheeran', genre: 'Pop'},
            {title: 'Make You Feel My Love', artist: 'Adele', genre: 'Pop'},
            {title: 'Wonderful Tonight', artist: 'Eric Clapton', genre: 'Rock'},
            {title: 'La Vie En Rose', artist: 'Édith Piaf', genre: 'Jazz'},
            {title: 'Unchained Melody', artist: 'The Righteous Brothers', genre: 'Soul'},
            {title: 'Perfect', artist: 'Ed Sheeran', genre: 'Pop'},
            {title: 'All of Me', artist: 'John Legend', genre: 'R&B'}
        ],
        genres: ['Soul', 'R&B', 'Jazz', 'Acoustic'],
        descriptions: ['Love is in the air', 'Heartfelt melodies', 'Tender moments soundtrack'],
        quote: 'Let love bloom with every melody 💕'
    },
    focused: {
        songs: [
            {title: 'Time', artist: 'Hans Zimmer', genre: 'Soundtrack'},
            {title: 'Intro', artist: 'The xx', genre: 'Indie'},
            {title: 'Midnight City', artist: 'M83', genre: 'Electronic'},
            {title: 'Strobe', artist: 'Deadmau5', genre: 'Electronic'},
            {title: 'Avril 14th', artist: 'Aphex Twin', genre: 'Electronic'},
            {title: 'Radioactive', artist: 'Imagine Dragons', genre: 'Alternative'},
            {title: 'Nuvole Bianche', artist: 'Ludovico Einaudi', genre: 'Classical'},
            {title: 'Teardrop', artist: 'Massive Attack', genre: 'Trip Hop'}
        ],
        genres: ['Instrumental', 'Lo-fi', 'Electronic', 'Ambient'],
        descriptions: ['Deep work mode activated', 'Concentration-enhancing rhythms', 'Flow state soundscape'],
        quote: 'Focus sharpens with every beat 🎯'
    },
    nostalgic: {
        songs: [
            {title: 'Summer of \'69', artist: 'Bryan Adams', genre: 'Rock'},
            {title: 'Yesterday', artist: 'The Beatles', genre: 'Rock'},
            {title: 'Take On Me', artist: 'a-ha', genre: 'Synth Pop'},
            {title: 'Landslide', artist: 'Fleetwood Mac', genre: 'Rock'},
            {title: 'The Sound of Silence', artist: 'Simon & Garfunkel', genre: 'Folk'},
            {title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock'},
            {title: 'Hotel California', artist: 'Eagles', genre: 'Rock'},
            {title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'Rock'}
        ],
        genres: ['Classic Rock', 'Oldies', 'Folk', 'Retro Pop'],
        descriptions: ['Journey through memory lane', 'Timeless classics that resonate', 'Bittersweet reminiscence'],
        quote: 'Relive the moments that shaped you 🌅'
    },
    adventurous: {
        songs: [
            {title: 'Born to Run', artist: 'Bruce Springsteen', genre: 'Rock'},
            {title: 'Life is a Highway', artist: 'Tom Cochrane', genre: 'Rock'},
            {title: 'Radioactive', artist: 'Imagine Dragons', genre: 'Alternative'},
            {title: 'Adventure of a Lifetime', artist: 'Coldplay', genre: 'Pop Rock'},
            {title: 'Roar', artist: 'Katy Perry', genre: 'Pop'},
            {title: 'Don\'t Stop Believin\'', artist: 'Journey', genre: 'Rock'},
            {title: 'Viva La Vida', artist: 'Coldplay', genre: 'Alternative'},
            {title: 'On Top of the World', artist: 'Imagine Dragons', genre: 'Alternative'}
        ],
        genres: ['Rock', 'Alternative', 'World', 'Indie'],
        descriptions: ['Epic journey soundtrack', 'Wanderlust and wild spirits', 'Explore the unknown'],
        quote: 'Embark on your next adventure with every note 🌍'
    }
};

// Generate playlist
async function generatePlaylist() {
    const generateBtn = document.querySelector('.generate-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const musicPlayer = document.getElementById('musicPlayer');
    const noPreviewMessage = document.getElementById('noPreviewMessage');
    
    // Show loading state
    generateBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';
    
    // Clear previous player state
    musicPlayer.src = '';
    noPreviewMessage.style.display = 'none';

    const mood = musicDatabase[selectedMood];
    const playlistNames = {
        happy: ['Sunshine Vibes', 'Pure Joy Mix', 'Happy Days Playlist', 'Positive Energy Flow'],
        sad: ['Rainy Day Reflections', 'Melancholy Moments', 'Tears & Therapy', 'Emotional Release'],
        energetic: ['Beast Mode Activated', 'High Voltage', 'Power Hour', 'Adrenaline Rush'],
        calm: ['Zen Garden', 'Peaceful Paradise', 'Tranquil Waters', 'Serene Soundscape'],
        romantic: ['Love Songs Collection', 'Heart & Soul', 'Romance Under Stars', 'Soulmate Soundtrack'],
        focused: ['Deep Focus Zone', 'Productivity Flow', 'Study Sanctuary', 'Concentration Station'],
        nostalgic: ['Memory Lane', 'Throwback Therapy', 'Golden Years', 'Time Capsule Tunes'],
        adventurous: ['Epic Journey', 'Wanderlust Playlist', 'Adventure Awaits', 'Freedom Tracks']
    };

    // Modify playlist name based on weather and time
    let modifiedName = playlistNames[selectedMood][Math.floor(Math.random() * playlistNames[selectedMood].length)];
    
    if (selectedWeather === 'rainy') modifiedName += ' 🌧️';
    else if (selectedWeather === 'snowy') modifiedName += ' ❄️';
    else if (selectedWeather === 'cloudy') modifiedName += ' ☁️';
    else if (selectedWeather === 'windy') modifiedName += ' 💨';
    
    if (selectedTime === 'night' || selectedTime === 'latenight') modifiedName += ' (Night Edition)';
    else if (selectedTime === 'morning') modifiedName += ' (Morning Boost)';
    else if (selectedTime === 'evening') modifiedName += ' (Evening Chill)';

    // Display results
    document.getElementById('playlistName').textContent = modifiedName;
    document.getElementById('moodDescription').textContent = musicDatabase[selectedMood].quote;

    // Display genres
    const genreContainer = document.getElementById('genreTags');
    genreContainer.innerHTML = '';
    mood.genres.forEach((genre, index) => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.textContent = genre;
        tag.style.animationDelay = `${index * 0.1}s`;
        genreContainer.appendChild(tag);
    });

    // Display songs with Spotify previews
    const songContainer = document.getElementById('songList');
    songContainer.innerHTML = '';
    
    let songsToShow = [...mood.songs];
    songsToShow = shuffleArray(songsToShow);
    
    // Adjust number of songs based on intensity
    if (intensity > 7) {
        songsToShow = songsToShow.slice(0, 5);
    } else if (intensity > 4) {
        songsToShow = songsToShow.slice(0, 3);
    } else {
        songsToShow = songsToShow.slice(0, 2);
    }

    // Fetch Spotify previews
    for (let song of songsToShow) {
        const previewUrl = accessToken ? await fetchSpotifyPreview(song.title, song.artist) : null;
        song.preview = previewUrl;
    }

    songsToShow.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.style.animationDelay = `${index * 0.1}s`;
        li.innerHTML = `
            <div class="song-title">${song.title}</div>
            <div class="song-artist">by ${song.artist} • ${song.genre}</div>
        `;
        li.addEventListener('click', () => {
            if (song.preview) {
                musicPlayer.src = song.preview;
                musicPlayer.style.display = 'block';
                noPreviewMessage.style.display = 'none';
                musicPlayer.play().catch(err => console.error('Playback error:', err.message));
            } else {
                musicPlayer.src = '';
                musicPlayer.style.display = 'none';
                noPreviewMessage.style.display = 'block';
            }
        });
        songContainer.appendChild(li);
    });

    // Set first song preview if available
    const firstSong = songsToShow[0];
    if (firstSong && firstSong.preview) {
        musicPlayer.src = firstSong.preview;
        musicPlayer.style.display = 'block';
        noPreviewMessage.style.display = 'none';
    } else {
        musicPlayer.src = '';
        musicPlayer.style.display = 'none';
        noPreviewMessage.style.display = 'block';
    }

    // Update vibe circle
    const vibeCircle = document.getElementById('vibeCircle');
    const moodEmojis = {
        happy: '😊',
        sad: '😢',
        energetic: '⚡',
        calm: '😌',
        romantic: '💕',
        focused: '🎯',
        nostalgic: '🌅',
        adventurous: '🌍'
    };
    vibeCircle.textContent = moodEmojis[selectedMood];
    vibeCircle.style.background = getComputedStyle(document.body).background;

    // Show results with animation
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('show');
    void resultsSection.offsetWidth;
    resultsSection.classList.add('show');
    
    // Reset button state
    generateBtn.disabled = false;
    btnText.style.display = 'inline-block';
    btnLoading.style.display = 'none';
}

// Utility function to shuffle array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}