import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const VideoChat = ({ socket, roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const [mediaError, setMediaError] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get("role");

  useEffect(() => {
    const startLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          const stream = event.streams[0];
          if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = stream;
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              roomId,
              candidate: event.candidate,
            });
          }
        };
      } catch (error) {
        console.error("Error accessing media devices.", error);
        setMediaError(true);
      }
    };

    startLocalVideo();

    socket.on("start-call", async () => {
      if (!peerConnection.current) return;
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("video-offer", { roomId, sdp: offer });
    });

    socket.on("video-offer", async ({ sdp }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("video-answer", { roomId, sdp: answer });
    });

    socket.on("video-answer", async ({ sdp }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error adding received ICE candidate", error);
      }
    });

    return () => {
      socket.off("start-call");
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");

      if (peerConnection.current) {
        peerConnection.current.close();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [socket, roomId, role]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {mediaError ? (
        <p style={{ color: "red" }}>
          Camera/Mic access denied. Video call unavailable.
        </p>
      ) : (
        <>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "250px",
              height: "180px",
              borderRadius: "8px",
              backgroundColor: "#000",
            }}
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "250px",
              height: "180px",
              borderRadius: "8px",
              backgroundColor: "#000",
            }}
          />
        </>
      )}
    </div>
  );
};

VideoChat.propTypes = {
  socket: PropTypes.object.isRequired,
  roomId: PropTypes.string.isRequired,
};

export default VideoChat;
