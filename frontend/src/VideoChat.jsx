import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const VideoChat = ({ socket, roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    const startLocalVideo = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };
    };

    startLocalVideo();

    socket.on("start-call", async () => {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("video-offer", { roomId, sdp: offer });
    });

    socket.on("video-offer", async ({ sdp }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("video-answer", { roomId, sdp: answer });
    });

    socket.on("video-answer", async ({ sdp }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding received ICE candidate", error);
      }
    });

    return () => {
      socket.off("start-call");
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
      peerConnection.current?.close();
    };
  }, [socket, roomId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "250px", height: "180px", borderRadius: "8px", backgroundColor: "#000" }} />
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "250px", height: "180px", borderRadius: "8px", backgroundColor: "#000" }} />
    </div>
  );
};

VideoChat.propTypes = {
  socket: PropTypes.object.isRequired,
  roomId: PropTypes.string.isRequired,
};

export default VideoChat;
