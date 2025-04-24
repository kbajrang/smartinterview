// src/VideoChat.jsx
import React, { useEffect, useRef } from "react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let peerConnection;

const VideoChat = ({ socket, roomId }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    const startMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;

      peerConnection = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track) =>
        peerConnection.addTrack(track, stream)
      );

      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("video-offer", { roomId, sdp: offer });
    };

    socket.on("video-offer", async ({ sdp }) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;

      peerConnection = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track) =>
        peerConnection.addTrack(track, stream)
      );

      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      await peerConnection.setRemoteDescription(sdp);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("video-answer", { roomId, sdp: answer });
    });

    socket.on("video-answer", async ({ sdp }) => {
      await peerConnection.setRemoteDescription(sdp);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    });

    startMedia();

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
      peerConnection?.close();
    };
  }, [socket, roomId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "250px", height: "180px", borderRadius: "8px", background: "#000" }} />
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "250px", height: "180px", borderRadius: "8px", background: "#000" }} />
    </div>
  );
};

export default VideoChat;
