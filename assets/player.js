// --- CONFIG ---
const DATABASE_FILE = 'tracks.txt';

// --- HELPER: Parse the Custom Backslash Database ---
function parseTextDatabase(text) {
    const songs = [];
    let currentSong = {};
    
    // Split by lines
    const lines = text.split('\n');
    
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return; // Skip empty lines

        // Check for specific keys (\track, \trackUrl, \trackImage)
        // Note: '\\' in JavaScript string means a single backslash '\'
        if (cleanLine.startsWith('\\track ')) {
            // If we were building a song previously, save it now
            if (Object.keys(currentSong).length > 0) {
                 // Ensure the previous song had a URL before saving
                if(currentSong.original_url) songs.push(currentSong);
            }
            // Start a new song object
            currentSong = { 
                name: cleanLine.substring(7).trim(), // Remove "\track "
                artist: "The Whale Project", // Default artist
                cover_art_url: ""
            };
        } else if (cleanLine.startsWith('\\trackUrl ')) {
            currentSong.original_url = cleanLine.substring(10).trim(); // Remove "\trackUrl "
        } else if (cleanLine.startsWith('\\trackImage ')) {
            currentSong.cover_art_url = cleanLine.substring(12).trim(); // Remove "\trackImage "
        }
    });

    // Push the final song if it exists and has a URL
    if (Object.keys(currentSong).length > 0 && currentSong.original_url) {
        songs.push(currentSong);
    }
    
    return songs;
}

// --- HELPER: Generate Playlist HTML ---
function renderPlaylist(songs) {
    const container = document.getElementById('playlist-container');
    container.innerHTML = ''; // Clear existing

    if (songs.length === 0) {
        container.innerHTML = '<div class="p-4 text-slate-500 text-xs">No tracks found. Check tracks.txt format.</div>';
        return;
    }

    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'amplitude-song-container flex items-center justify-between p-3 border-b border-slate-800 hover:bg-slate-900 transition-colors cursor-pointer group';
        item.setAttribute('data-song-index', index);
        item.setAttribute('data-amplitude-song-index', index);

        item.innerHTML = `
            <div class="flex items-center w-full">
                <span class="text-xs text-slate-600 mr-3 font-mono group-hover:text-teal-500">${(index + 1).toString().padStart(2, '0')}</span>
                <div class="flex flex-col">
                    <span class="text-xs font-semibold text-slate-300 group-hover:text-white">${song.name}</span>
                </div>
            </div>
            <div class="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
        `;
        container.appendChild(item);
    });                    
}

// --- SECURITY: Blob URL Generation ---
async function createSecureUrl(remoteUrl) {
    try {
        const response = await fetch(remoteUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.warn(`Secure load failed for ${remoteUrl}, falling back to direct link.`);
        return remoteUrl;
    }
}

// --- MAIN INIT ---
(async function initPlayer() {
    try {
        // 1. Fetch the database file
        const response = await fetch(DATABASE_FILE);
        if (!response.ok) throw new Error(`Could not load ${DATABASE_FILE}`);
        const textData = await response.text();
        
        // 2. Parse the text into song objects
        const rawSongs = parseTextDatabase(textData);

        // 3. Render the playlist visually
        renderPlaylist(rawSongs);

        // 4. Secure the Audio URLs (Blob logic)
        const secureSongs = await Promise.all(rawSongs.map(async (song) => {
            const blobUrl = await createSecureUrl(song.original_url);
            return {
                ...song,
                "url": blobUrl
            };
        }));

        // 5. Initialize Amplitude
        if (secureSongs.length > 0) {
            Amplitude.init({
                "songs": secureSongs,
                "preload": "metadata",
                "debug": true,
                "callbacks": {
                    'timeupdate': function(){
                        const pct = Amplitude.getSongPlayedPercentage();
                        const progressBar = document.getElementById('song-played-progress');
                        if(progressBar) progressBar.style.width = pct + '%';
                    }
                }
            });
        }

        // 6. Bind click events
        document.querySelectorAll('.amplitude-song-container').forEach(container => {
            container.addEventListener('click', function(e) {
                if (e.target.closest('.amplitude-play-pause')) return;
                const index = parseInt(this.getAttribute('data-song-index'));
                
                const state = Amplitude.getPlayerState();
                
                if (Amplitude.getActiveIndex() !== index || state === 'paused' || state === 'stopped') {
                    Amplitude.playSongAtIndex(index);
                }
            });
        });

    } catch (e) {
        console.error("Failed to load player data:", e);
    }
})();

// --- DISABLE RIGHT CLICK ---
document.addEventListener('contextmenu', event => event.preventDefault());
