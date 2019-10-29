const clientID = '67a4806438644f60bd9961b6935bed79';
const redirectURI = window.location.origin + '/';


let accessToken;

const Spotify = {

  // Get access token from Spotify
  getAccessToken() {
    // case 1: already there?
    if (accessToken) {
      return accessToken;
    }

    //case 2: already in URL?
    const hasAccessToken = window.location.href.match(/access_token=([^&]*)/);
    const hasExpiresIn = window.location.href.match(/expires_in=([^&]*)/);
    if (hasAccessToken && hasExpiresIn) {
      accessToken = hasAccessToken[1];
      const expiresIn = Number(hasExpiresIn[1]);
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    }

    //case 3:fetch from SPOTIFY
    else {
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
    }
  },

  // Use access token to return a response from the Spotify API using search term from SearchBar
   search(term) {
    const accessToken = Spotify.getAccessToken();
    const searchUrl = `https://api.spotify.com/v1/search?type=track&q=${term}`;
    return  fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(
        response => {
        if (response.ok) {
          return response.json();
        } else {
          console.log('API request failed');
        }
      }).then(
        jsonResponse => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map(track => {
          return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
          }});
      });
  },

  // Get a user's ID from Spotify, creates a new playlist on user's account, and adds tracks to that playlist
   savePlayList(playlistName, trackURIs) {
    if (!playlistName || !trackURIs || trackURIs.length === 0) {
      return;
    };
    const accessToken = Spotify.getAccessToken();

    const userUrl = 'https://api.spotify.com/v1/me';
    const headers = {
      Authorization: `Bearer ${accessToken}`
    };
    let userID;

    // Return user's ID from Spotify API
    return fetch(userUrl, {
      headers: headers
    }).then(
      response => response.json()
    ).then(
      jsonResponse => {
        userID = jsonResponse.id;

        // Add playlist to user's account
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({name: playlistName})
        }).then(
          response => {
            if (response.ok) {
              return response.json();
            } else {
              console.log('API request failed');
            }
          }).then(
            jsonResponse => {
              const playlistID = jsonResponse.id;

              // Add tracks to new PlayList
              return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({uris: trackURIs})
              });
            });

      });
    }

}

export default Spotify;
