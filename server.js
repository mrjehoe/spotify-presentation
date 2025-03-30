require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const querystring = require('querystring');
const axios = require('axios');

// Step 1: Redirect to Spotify's authorization page
app.get('/login', (req, res) => {
  const scope = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private'
  ].join(' ');

  const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });

  res.redirect(authUrl);
});

// Step 2: Spotify callback to exchange code for access token
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    return res.send('Error: No authorization code provided.');
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    res.redirect(`/devices?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.send('Authentication failed.');
  }
});

// Serve the device selection page
app.get('/devices', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'devices.html'));
});

// Get user's available Spotify devices
app.get('/api/devices', async (req, res) => {
    const accessToken = req.query.access_token;
  
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is missing' });
    }
  
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
});
  
// Serve the playlists page
app.get('/playlists', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get user's playlists using Spotify API
app.get('/api/playlists', async (req, res) => {
const accessToken = req.query.access_token;

if (!accessToken) {
    return res.status(400).json({ error: 'Access token is missing' });
}

try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers: {
        Authorization: `Bearer ${accessToken}`,
    },
    });

    res.json(response.data);
} catch (error) {
    console.error('Error fetching playlists:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch playlists' });
}
});

// Serve the presentation page
app.get('/presentation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'presentation.html'));
});

// Generate Trivia using GPT-3.5-Turbo
app.get('/api/factoid', async (req, res) => {
    const { song, artist, album, year } = req.query;
  
    if (!song || !artist || !album || !year) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const prompt = `Generate a short, fun, and interesting trivia fact about the album '${album}' by '${artist}', which was released in ${year}. You can also include trivia about the song '${song}' if relevant. Keep it concise and under 50 words.`;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const factoid = response.data.choices[0].message.content.trim();
      res.json({ factoid });
    } catch (error) {
      console.error('Error generating factoid:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to generate factoid' });
    }
  });
  
