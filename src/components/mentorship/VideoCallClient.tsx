/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';

export default function VideoCallClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const appId = searchParams.get('appId');
  const channel = searchParams.get('channel');
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(
    null
  );
  const [remoteUsers, setRemoteUsers] = useState<
    Record<string, { uid: UID; videoTrack?: IRemoteVideoTrack; audioTrack?: IRemoteAudioTrack }>
  >({});

  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appId || !channel || !token || !uid) {
      setError('Missing required session parameters.');
      return;
    }

    let isMounted = true;
    let activeClient: IAgoraRTCClient | null = null;
    let activeTracks: [IMicrophoneAudioTrack, ICameraVideoTrack] | null = null;

    const initAgora = async () => {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      if (!isMounted) return;

      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      activeClient = agoraClient;
      if (isMounted) setClient(agoraClient);

      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);

        if (mediaType === 'video') {
          setRemoteUsers((prev) => ({
            ...prev,
            [user.uid]: { ...prev[user.uid], uid: user.uid, videoTrack: user.videoTrack },
          }));
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setRemoteUsers((prev) => ({
            ...prev,
            [user.uid]: { ...prev[user.uid], uid: user.uid, audioTrack: user.audioTrack },
          }));
        }
      });

      agoraClient.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prev) => {
            const next = { ...prev };
            if (next[user.uid]) {
              next[user.uid].videoTrack = undefined;
            }
            return next;
          });
        }
      });

      agoraClient.on('user-left', (user) => {
        setRemoteUsers((prev) => {
          const next = { ...prev };
          delete next[user.uid];
          return next;
        });
      });

      try {
        await agoraClient.join(appId, channel, token, uid);
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        activeTracks = tracks;
        if (isMounted) {
          setLocalTracks(tracks);
          await agoraClient.publish(tracks);
          setIsJoined(true);
        } else {
          tracks[0].close();
          tracks[1].close();
          agoraClient.leave();
        }
      } catch (err: any) {
        console.error('Agora Init Error', err);
        if (isMounted)
          setError(
            'Failed to join the video session. Please check your permissions and connection.'
          );
      }
    };

    initAgora();

    return () => {
      isMounted = false;
      if (activeTracks) {
        activeTracks[0].stop();
        activeTracks[0].close();
        activeTracks[1].stop();
        activeTracks[1].close();
      }
      void activeClient?.leave();
    };
  }, [appId, channel, token, uid]);

  useEffect(() => {
    if (localTracks && localVideoRef.current && !isVideoOff) {
      localTracks[1].play(localVideoRef.current);
    }
  }, [localTracks, isVideoOff]);

  const leaveCall = async (isUnmount = false) => {
    if (localTracks) {
      localTracks[0].stop();
      localTracks[0].close();
      localTracks[1].stop();
      localTracks[1].close();
    }
    if (client) {
      await client.leave();
    }
    if (!isUnmount) {
      router.push(returnUrl);
    }
  };

  const toggleMic = () => {
    if (localTracks) {
      localTracks[0].setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localTracks) {
      localTracks[1].setMuted(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  if (error) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            background: '#1E293B',
            padding: 40,
            borderRadius: 24,
            textAlign: 'center',
            maxWidth: 400,
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
            }}
          >
            <PhoneOff size={32} />
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 24 }}>Connection Error</h2>
          <p style={{ color: '#94A3B8', margin: '0 0 24px 0', lineHeight: 1.5 }}>{error}</p>
          <button
            onClick={() => router.push(returnUrl)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFF',
              borderRadius: 12,
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          color: '#FFFFFF',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Loader2 size={48} className="animate-spin" color="#3B82F6" />
        <p style={{ fontSize: 18, fontWeight: 500, color: '#94A3B8' }}>
          Connecting to secure room...
        </p>
      </div>
    );
  }

  const remoteUsersArray = Object.values(remoteUsers);

  return (
    <div
      style={{
        height: '100vh',
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 12px #10B981',
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            Mentorship Session
          </h1>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 14,
            color: '#E2E8F0',
            backdropFilter: 'blur(8px)',
          }}
        >
          {remoteUsersArray.length + 1} Participant{remoteUsersArray.length + 1 !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Video Grid */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          padding: '80px 32px 100px 32px',
          overflowY: 'auto',
        }}
      >
        {/* Remote Users */}
        {remoteUsersArray.map((user) => (
          <div
            key={user.uid}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: remoteUsersArray.length > 0 ? '800px' : '600px',
              aspectRatio: '16/9',
              background: '#0F172A',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
              border: '1px solid #1E293B',
            }}
          >
            {user.videoTrack ? (
              <RemoteVideoTrack track={user.videoTrack} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748B',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <VideoOff size={32} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 500 }}>Video Paused</span>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                color: '#fff',
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '8px 16px',
                borderRadius: 12,
                backdropFilter: 'blur(8px)',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Participant
            </div>
          </div>
        ))}

        {/* Local Video */}
        <div
          style={{
            position: remoteUsersArray.length > 0 ? 'absolute' : 'relative',
            bottom: remoteUsersArray.length > 0 ? 120 : 'auto',
            right: remoteUsersArray.length > 0 ? 32 : 'auto',
            width: remoteUsersArray.length > 0 ? 280 : '100%',
            maxWidth: 600,
            aspectRatio: '16/9',
            background: '#0F172A',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow:
              remoteUsersArray.length > 0
                ? '0 12px 32px -8px rgba(0,0,0,0.8)'
                : '0 24px 48px -12px rgba(0,0,0,0.5)',
            border: '2px solid #3B82F6',
            zIndex: 5,
            transition: 'all 0.3s ease',
          }}
        >
          <div ref={localVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {isVideoOff && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 2,
              }}
            >
              <VideoOff size={32} color="#64748B" style={{ marginBottom: 8 }} />
              <span style={{ color: '#64748B', fontSize: 14, fontWeight: 500 }}>
                You (Video Off)
              </span>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              color: '#fff',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '6px 12px',
              borderRadius: 8,
              backdropFilter: 'blur(8px)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 3,
            }}
          >
            You {isMuted && <MicOff size={12} color="#EF4444" />}
          </div>
        </div>
      </div>

      {/* Controls Container */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          padding: '16px 32px',
          borderRadius: 32,
          display: 'flex',
          gap: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}
      >
        <button
          onClick={toggleMic}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.1)',
            color: isMuted ? '#FFFFFF' : '#E2E8F0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (!isMuted) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseOut={(e) => {
            if (!isMuted) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.1)',
            color: isVideoOff ? '#FFFFFF' : '#E2E8F0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (!isVideoOff) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseOut={(e) => {
            if (!isVideoOff) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          title={isVideoOff ? 'Start Video' : 'Stop Video'}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

        <button
          onClick={() => leaveCall()}
          style={{
            width: 72,
            height: 56,
            borderRadius: 28,
            background: '#EF4444',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            fontWeight: 600,
            padding: '0 20px',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#DC2626')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#EF4444')}
          title="Leave Call"
        >
          <PhoneOff size={20} /> Leave
        </button>
      </div>
    </div>
  );
}

function RemoteVideoTrack({ track }: { track: IRemoteVideoTrack }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && ref.current) {
      track.play(ref.current);
    }
  }, [track]);

  return <div ref={ref} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}
