document.getElementById('login').onclick = function() {
    window.location.href = '/login';
  };
  
// Extract access token from the URL
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');

if (accessToken) {
  fetchPlaylists(accessToken);
} else {
  console.log('No access token found. Please log in.');
}

// Fetch user's playlists
function fetchPlaylists(token) {
  fetch(`/api/playlists?access_token=${token}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      return response.json();
    })
    .then(data => {
      displayPlaylists(data.items);
    })
    .catch(error => {
      console.error('Error fetching playlists:', error);
    });
}

// Display playlists on the page
function displayPlaylists(playlists) {
  const playlistContainer = document.getElementById('playlists');
  playlistContainer.innerHTML = '';

  if (!playlists || playlists.length === 0) {
    playlistContainer.innerHTML = '<p>No playlists found.</p>';
    return;
  }

  playlists.forEach((playlist) => {
    const playlistElement = document.createElement('div');
    playlistElement.classList.add('playlist');

    playlistElement.innerHTML = `
      <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${playlist.name}">
      <h3>${playlist.name}</h3>
      <p>Tracks: ${playlist.tracks.total}</p>
    `;

    // Add click event to navigate to presentation mode
    playlistElement.onclick = () => {
        window.location.href = `/presentation?playlistId=${playlist.id}&access_token=${accessToken}`;
        };

    playlistContainer.appendChild(playlistElement);
  });
}