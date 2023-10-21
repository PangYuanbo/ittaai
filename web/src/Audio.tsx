import React, {useEffect, useRef, useState} from 'react';

const SEND_INTERVAL = 1000; // 每秒发送一次

const Audio: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.current.onopen = () => {
      console.log("Connected to the WS server");
    };

    ws.current.onerror = (error: Event) => {
      console.error("WebSocket Error:", error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendData = () => {
    if (audioChunks.current.length === 0) return;

    const audioBlob = new Blob(audioChunks.current, {type: 'audio/webm'});
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(audioBlob);
    }

    audioChunks.current = [];
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});

      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = event => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = sendData;

      mediaRecorder.current.start();

      setRecording(true);

      const interval = setInterval(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
          mediaRecorder.current.stop();
          mediaRecorder.current.start();
        }
      }, SEND_INTERVAL);

      return () => clearInterval(interval);

    } catch (err) {
      console.error("Error accessing audio:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
  };

  return (
      <div>
        {!recording && <button onClick={startRecording}>Start Recording</button>}
        {recording && <button onClick={stopRecording}>Stop Recording</button>}
      </div>
  );
}

export default Audio;
