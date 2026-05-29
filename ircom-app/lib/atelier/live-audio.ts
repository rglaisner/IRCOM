/** PCM helpers for Gemini Live: 16 kHz mic in, 24 kHz playback out. */

export const LIVE_INPUT_SAMPLE_RATE = 16_000;
export const LIVE_OUTPUT_SAMPLE_RATE = 24_000;

function floatTo16BitPcm(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    output[index] = sample < 0 ? sample * 0x80_00 : sample * 0x7f_ff;
  }
  return output;
}

function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Int16Array(bytes.buffer);
}

export function encodePcmChunk(float32Pcm: Float32Array): { data: string; mimeType: string } {
  const pcm16 = floatTo16BitPcm(float32Pcm);
  return {
    data: int16ToBase64(pcm16),
    mimeType: `audio/pcm;rate=${LIVE_INPUT_SAMPLE_RATE}`,
  };
}

export class LiveAudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stop();
    }
  }

  stop(): void {
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  async playBase64Pcm(base64: string): Promise<void> {
    if (this.muted || typeof window === "undefined") {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const pcm16 = base64ToInt16(base64);
    const float32 = new Float32Array(pcm16.length);
    for (let index = 0; index < pcm16.length; index += 1) {
      float32[index] = (pcm16[index] ?? 0) / 0x80_00;
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, LIVE_OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startAt = Math.max(this.nextStartTime, this.audioContext.currentTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
  }

  dispose(): void {
    void this.audioContext?.close();
    this.audioContext = null;
    this.nextStartTime = 0;
  }
}

export class LiveMicCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async start(onChunk: (chunk: Float32Array) => void): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(input, this.audioContext?.sampleRate ?? 48_000, LIVE_INPUT_SAMPLE_RATE);
      onChunk(downsampled);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.audioContext = null;
  }
}

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Float32Array {
  if (outputSampleRate === inputSampleRate) {
    return buffer.slice();
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(buffer.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    output[index] = buffer[Math.floor(index * ratio)] ?? 0;
  }

  return output;
}
