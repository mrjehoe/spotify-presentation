const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
let selectedDeviceId = null;

// Fetch Available Devices
async function fetchDevices() {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    displayDevices(data.devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    document.getElementById('devices-list').innerHTML = '<p>Error loading devices. Ensure Spotify is open on one of your devices.</p>';
  }
}

// Display Devices
function displayDevices(devices) {
  const devicesList = document.getElementById('devices-list');
  devicesList.innerHTML = '';

  if (!devices || devices.length === 0) {
    devicesList.innerHTML = '<p>No devices found. Make sure Spotify is running on a device.</p>';
    return;
  }

  devices.forEach((device) => {
    const deviceElement = document.createElement('div');
    deviceElement.classList.add('device');
    deviceElement.textContent = `${device.name} (${device.type})`;
    deviceElement.onclick = () => selectDevice(device.id, deviceElement);

    devicesList.appendChild(deviceElement);
  });
}

// Highlight Selected Device
function selectDevice(deviceId, element) {
  selectedDeviceId = deviceId;

  // Remove previous selection highlight
  document.querySelectorAll('.device').forEach((el) => {
    el.style.backgroundColor = '';
  });

  // Highlight current selection
  element.style.backgroundColor = '#1DB954';
}

// Confirm Device Selection
document.getElementById('confirm-device').onclick = () => {
  if (!selectedDeviceId) {
    alert('Please select a device first.');
    return;
  }

  localStorage.setItem('spotifyDeviceId', selectedDeviceId);
  window.location.href = `/playlists?access_token=${accessToken}`;
};

fetchDevices();