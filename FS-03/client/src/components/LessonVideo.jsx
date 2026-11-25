import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

// Same base URL the rest of the app uses.
// VITE_API_URL already includes /api — do NOT append /api again.
const PROD_API_URL = 'https://learning-management-system-live-classes-753172578941.asia-south1.run.app/api';
const API = (import.meta.env.VITE_API_URL || PROD_API_URL).replace(/\/+$/, '');

export default function LessonVideo({ videoJobId }) {
  const videoRef = useRef(null);
  const [playbackError, setPlaybackError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (!videoJobId) {
      setPlaybackError('Video job ID is missing.');
      return undefined;
    }

    const token = localStorage.getItem('learnlive_token');
    if (!token) {
      setPlaybackError('Please sign in again to watch this video.');
      return undefined;
    }

    const playlistUrl = `${API}/videos/${encodeURIComponent(videoJobId)}/playlist`;
    let hls = null;
    let cancelled = false;
    let retryTimer = null;

    setPlaybackError('');
    setProcessing(false);

    async function start() {
      // Pre-flight check: gives us the real HTTP status before HLS.js tries.
      let res;
      try {
        res = await fetch(playlistUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        if (!cancelled) {
          setPlaybackError('Cannot reach the video server (network or CORS error).');
        }
        return;
      }

      if (cancelled) return;

      // 425 — job queued/active but not yet completed; keep retrying.
      // 404 — job may have just been queued and not yet picked up by worker.
      // Both are transient: auto-retry every 3 s.
      if (res.status === 425 || res.status === 404) {
        setProcessing(true);
        setPlaybackError('');
        retryTimer = setTimeout(start, 3000);
        return;
      }

      // 409 — processing failed permanently.
      if (res.status === 409) {
        setProcessing(false);
        setPlaybackError('Video processing failed. Please contact support or re-upload the video.');
        return;
      }

      // 403 — not enrolled / not authorised.
      if (res.status === 403) {
        setProcessing(false);
        setPlaybackError('You are not enrolled in this course.');
        return;
      }

      if (!res.ok) {
        setProcessing(false);
        setPlaybackError(`Unable to load video (HTTP ${res.status}). Please try again.`);
        return;
      }

      // Response body was consumed by the preflight fetch; HLS.js needs to
      // make its own request. That's fine — both requests hit the same route.
      const text = await res.text();
      if (!text.trimStart().startsWith('#EXTM3U')) {
        setProcessing(false);
        setPlaybackError('Server did not return a valid HLS playlist.');
        return;
      }

      // All good — hand off to HLS.js.
      setProcessing(false);
      setPlaybackError('');

      if (Hls.isSupported()) {
        hls = new Hls({
          // Attach the JWT to every playlist and .ts segment XHR.
          xhrSetup: (xhr) => {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          },
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setPlaybackError('');
          setProcessing(false);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data.type, data.details, data.response?.code);

          if (!data.fatal) return;

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            const code = data.response?.code;
            if (code === 401 || code === 403) {
              setPlaybackError('Session expired. Please sign out and sign back in.');
            } else {
              setPlaybackError(
                code
                  ? `Video request failed (HTTP ${code}).`
                  : 'Network error while loading the video.'
              );
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setPlaybackError('Unable to play this video.');
            hls.destroy();
          }
        });

        hls.loadSource(playlistUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS — cannot send Authorization header on segment requests.
        // Serve the playlist directly; segments will fail auth. Acceptable fallback.
        video.src = playlistUrl;
      } else {
        setPlaybackError('Your browser does not support HLS video playback.');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoJobId]);

  return (
    <div className="lesson-video">
      <video ref={videoRef} controls width="100%" preload="metadata">
        Your browser does not support video playback.
      </video>

      {processing && (
        <p style={{ color: '#7f8c8d', marginTop: 8, fontStyle: 'italic' }}>
          ⏳ Video is still processing. This page will auto-refresh when ready…
        </p>
      )}

      {playbackError && (
        <p role="alert" style={{ color: '#c0392b', marginTop: 8 }}>
          {playbackError}
        </p>
      )}
    </div>
  );
}
