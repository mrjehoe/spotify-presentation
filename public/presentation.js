const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const playlistId = urlParams.get('playlistId');
let currentTrackIndex = 0;
let tracks = [];

// Fetch Playlist Tracks
async function fetchPlaylistTracks() {
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch playlist tracks');
    }

    const data = await response.json();
    tracks = data.items;

    if (tracks.length === 0) {
        document.getElementById('song-title').textContent = 'No tracks available';
        return;
    }

    displayTrack();
    await updatePlayPauseButtonState(); // Ensure button state is correct

  } catch (error) {
    console.error('Error fetching tracks:', error);
  }
}

// Display Track Details
function displayTrack() {
  if (tracks.length === 0) return;

  const track = tracks[currentTrackIndex].track;

  const albumName = track.album.name;
  const releaseDate = track.album.release_date.split('-')[0];
  const artistNames = track.artists.map(artist => artist.name).join(', ');
  const albumArtUrl = track.album.images[0]?.url || 'https://via.placeholder.com/300';

  document.getElementById('album-art').src = track.album.images[0]?.url || 'https://via.placeholder.com/300';
  document.getElementById('song-title').textContent = track.name;
  document.getElementById('artist-name').textContent = artistNames;
  document.getElementById('album-name').textContent = `${albumName} (${releaseDate})`;

  // Set blurred album art as background
  const backgroundOverlay = document.getElementById('background-overlay');
  backgroundOverlay.style.backgroundImage = `url('${albumArtUrl}')`;

  // Fetch and display trivia
  fetchFactoid(track.name, artistNames, albumName, releaseDate);

  playTrack(track.uri);

  // Adjust album art size based on song details
  function adjustAlbumArtSize() {
    const albumArt = document.getElementById('album-art');
    const songDetails = document.getElementById('song-details');
    const presentedItem = document.getElementById('presented_item');
  
    // Get edge positions using getBoundingClientRect
    const presentedBottom = presentedItem.getBoundingClientRect().bottom;
    const songDetailsTop = songDetails.getBoundingClientRect().top;
  
    // Calculate the space between the bottom of presented_item and the top of song_details
    const availableHeight = songDetailsTop - presentedBottom - 40; // Add a 40px buffer
  
    // Ensure album art doesn't shrink below 150px
    const newHeight = Math.max(availableHeight, 150);
    albumArt.style.maxHeight = `${newHeight}px`;
  }

  // Run initially to ensure proper sizing
  adjustAlbumArtSize();

  // Observe changes to song details and presented item for dynamic resizing
  const resizeObserver = new ResizeObserver(adjustAlbumArtSize);

  resizeObserver.observe(document.getElementById('song-details'));
  resizeObserver.observe(document.getElementById('presented_item'));
  window.addEventListener('resize', adjustAlbumArtSize);
}

// Transfer Playback to Selected Device and Play Track
async function playTrack(uri) {
    const selectedDeviceId = localStorage.getItem('spotifyDeviceId');
  
    if (!selectedDeviceId) {
      console.error('No selected device. Please select a device before starting playback.');
      return;
    }
  
    try {
      // Transfer playback to the selected device
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_ids: [selectedDeviceId], play: false }),
      });
  
      // Play the specified track
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${selectedDeviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [uri] }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error playing track:', errorData);
        return;
      }

    // Give Spotify a second to register the playback state
    setTimeout(async () => {
        await updatePlayPauseButtonState();
    }, 1000); // 1 second delay

    } catch (error) {
      console.error('Error playing track:', error);
    }
  }

// Playback Controls
document.getElementById('prev').onclick = () => {
  if (currentTrackIndex > 0) {
    currentTrackIndex--;
    displayTrack();
  }
};

document.getElementById('next').onclick = () => {
  if (currentTrackIndex < tracks.length - 1) {
    currentTrackIndex++;
    displayTrack();
  }
};

document.getElementById('play-pause').onclick = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        console.error('Error fetching playback state');
        return;
      }
  
      const playerState = await response.json().catch(() => ({})); // Handle empty response safely
      const isPlaying = playerState.is_playing || false;
  
      await fetch(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}?device_id=${localStorage.getItem('spotifyDeviceId')}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      document.getElementById('play-pause').textContent = isPlaying ? 'Play' : 'Pause';
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
};

// Check Playback State and Update Play/Pause Button
async function updatePlayPauseButtonState() {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        console.warn('Playback state unavailable. Assuming no active playback.');
        document.getElementById('play-pause').textContent = 'Play';
        return;
      }
  
      const playerState = await response.json();
      const isPlaying = playerState.is_playing;
  
      document.getElementById('play-pause').textContent = isPlaying ? 'Pause' : 'Play';
    } catch (error) {
      console.error('Error fetching playback state:', error);
    }
}

// Return to the playlist selection screen
document.getElementById('return-to-playlists').onclick = () => {
    const accessToken = urlParams.get('access_token');
    window.location.href = `/playlists?access_token=${accessToken}`;
};

// Fetch and Display AI-Generated Factoids
async function fetchFactoid(song, artist, album, year) {
    try {
      const response = await fetch(`/api/factoid?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&year=${encodeURIComponent(year)}`);
      const data = await response.json();
  
      const factoidElement = document.getElementById('factoid');
      if (data.factoid) {
        factoidElement.textContent = `"${data.factoid}"`;
      } else {
        factoidElement.textContent = 'No fun fact available for this track.';
      }
    } catch (error) {
      console.error('Error fetching factoid:', error);
    }
}

fetchPlaylistTracks();