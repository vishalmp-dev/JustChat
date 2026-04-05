import React, { useEffect, useRef, useState } from "react";
import "../videoMeet.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { io } from "socket.io-client";
import { BsCameraVideo, BsCameraVideoOff, BsDisplay } from "react-icons/bs";
import { BsMic, BsMicMute } from "react-icons/bs";
import { MdCallEnd } from "react-icons/md";
import Badge from "@mui/material/Badge";
import { BsChatText } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import server from "../environment";

const server_url = server;
let connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function VideoMeet() {
  let socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState();
  let [videos, setVideos] = useState([]);
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(3);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  let routeTo = useNavigate();

  const videoRef = useRef([]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) setVideoAvailable(true);
      console.log("video: ", videoAvailable);
    } catch {
      setVideoAvailable(false);
      console.log("video failed");
    }

    try {
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) setAudioAvailable(true);
      console.log("audio: ", audioAvailable);
    } catch {
      setAudioAvailable(false);
      console.log("audio failed");
    }

    try {
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        try {
          const userMediaStream = await navigator.mediaDevices.getUserMedia({
            video: videoAvailable,
            audio: audioAvailable,
          });
          if (userMediaStream) {
            window.localStream = userMediaStream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = userMediaStream;
            }
          }
        } catch {
          const userMediaStream = await navigator.mediaDevices.getUserMedia({
            video: videoAvailable,
            audio: false,
          });
          if (userMediaStream) {
            window.localStream = userMediaStream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = userMediaStream;
            }
          }
        }
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) { console.log(e); }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      if (connections[id].signalingState === "stable") {
        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
            })
            .catch((e) => console.log(e));
        });
      }
    }

    stream.getTracks().forEach((track) => (track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { console.log(e); }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;

      for (let id in connections) {
        connections[id].addStream(window.localStream);
        if (connections[id].signalingState === "stable") {
          connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description)
              .then(() => {
                socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
              })
              .catch((e) => console.log(e));
          });
        }
      }
    }));
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { console.log(e); }
    }
  };

  useEffect(() => {
    if (video != undefined && audio != undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId].createAnswer()
                .then((description) => {
                  connections[fromId].setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io(server_url, { secure: false, transports: ["websocket"] });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      console.log("connected to socket server");
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
            }
          };

          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find((video) => video.socketId === socketListId);

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId ? { ...video, stream: event.stream } : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true,
                playsinline: true,
              };
              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream != undefined && window.localStream != null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            if (connections[id2].signalingState === "stable") {
              connections[id2].createOffer().then((description) => {
                connections[id2].setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections[id2].localDescription }));
                  })
                  .catch((e) => console.log(e));
              });
            }
          }
        }
      });
    });

    socketRef.current.on("connect_error", (err) => {
      console.log("connection error:", err);
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => { setVideo(!video); };
  let handleAudio = () => { setAudio(!audio); };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) { console.log(e); }

    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) { console.log(e); }

    routeTo("/home");
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handleScreen = () => {
    if (screen) {
      window.localStream.getTracks().forEach((track) => track.stop());
      setScreen(false);
      setVideo(false);
      setAudio(false);
      setTimeout(() => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
      }, 200);
    } else {
      setScreen(true);
    }
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) { console.log(e); }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      if (connections[id].signalingState === "stable") {
        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
            })
            .catch((e) => console.log(e));
        });
      }
    }

    stream.getTracks().forEach((track) => (track.onended = () => {
      setScreen(false);
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { console.log(e); }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;

      for (let id in connections) {
        connections[id].addStream(window.localStream);
        if (connections[id].signalingState === "stable") {
          connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description)
              .then(() => {
                socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
              }).catch(e => console.log(e));
          });
        }
      }
    }));
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen != undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  return (
    <div>
      {askForUsername === true ? (

        // ✅ fixed lobby — responsive on all devices
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: "1rem",
          gap: "1rem"
        }}>
          <h2 style={{ margin: 0, textAlign: "center" }}>Enter into the Lobby</h2>

          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{
              width: "100%",
              maxWidth: "400px",
              maxHeight: "40vh",
              borderRadius: "1rem",
              objectFit: "cover"
            }}
          />

          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            variant="outlined"
            style={{ width: "100%", maxWidth: "400px" }}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Button
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "3rem",
              backgroundColor: "rgba(5, 5, 254, 0.682)",
              color: "white",
              fontWeight: "bold"
            }}
            onClick={connect}
          >
            Connect
          </Button>
        </div>

      ) : (
        <div className="meetVideoContainer">
          {showModal ? (
            <div className="chatRoom">
              <div className="chatContainer">
                <h2 style={{ marginTop: "1rem", color: "rgba(5, 5, 254, 0.682)", fontSize: "2rem" }}>JustChat</h2>
                <span style={{ fontSize: "0.8rem", color: "red" }}>If video window is not rendering, try to on and off video icon once</span>

                <div className="chattingDisplay">
                  {messages.map((item, index) => {
                    return (
                      <div style={{ marginBottom: "1rem", marginTop: "1rem" }} key={index}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="chattingArea">
                  <TextField style={{ flex: 1 }} value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter your Chat" variant="outlined" />
                  <Button variant="contained" style={{ height: "3rem", backgroundColor: "rgba(5, 5, 254, 0.682)", color: "white", fontWeight: "bold" }} onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className="buttonContainer">
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <BsCameraVideo size={40} /> : <BsCameraVideoOff size={40} />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <MdCallEnd size={40} />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <BsMic size={40} /> : <BsMicMute size={40} />}
            </IconButton>

            <IconButton onClick={handleScreen} style={{ color: screen ? "green" : "white" }}>
              <BsDisplay size={40} />
            </IconButton>

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white", fontWeight: "bold" }}>
                <BsChatText size={40} />
              </IconButton>
            </Badge>
          </div>

          <video
            className="meetUserVideo"
            ref={localVideoRef}
            autoPlay
            muted
            style={{ display: video === true ? "block" : "none" }}
          />

          <div className="conferenceView">
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeet;