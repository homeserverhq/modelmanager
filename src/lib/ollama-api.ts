// Ollama API Types and Service

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface RunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

export interface ModelDetails {
  modelfile: string;
  parameters: string;
  template: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  model_info: Record<string, unknown>;
  modified_at: string;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface CreateModelParams {
  model: string;
  from: string;
  system?: string;
  parameters?: {
    num_ctx?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
  };
}

export interface LoadModelParams {
  model: string;
  keep_alive?: string;
}

// Storage key for server URL
const STORAGE_KEY = 'ollama_server_url';

export const getStoredServerUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
};

export const setStoredServerUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, url);
  }
};

// Normalize the base URL
const normalizeUrl = (url: string): string => {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'http://' + normalized;
  }
  return normalized.replace(/\/+$/, '');
};

// API Functions
export const checkConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${normalizeUrl(serverUrl)}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const getModels = async (serverUrl: string): Promise<OllamaModel[]> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/tags`);
  if (!response.ok) throw new Error('Failed to fetch models');
  const data = await response.json();
  return data.models || [];
};

export const getRunningModels = async (serverUrl: string): Promise<RunningModel[]> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/ps`);
  if (!response.ok) throw new Error('Failed to fetch running models');
  const data = await response.json();
  return data.models || [];
};

export const getModelDetails = async (serverUrl: string, modelName: string): Promise<ModelDetails> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });
  if (!response.ok) throw new Error('Failed to fetch model details');
  return response.json();
};

export const loadModel = async (
  serverUrl: string,
  params: LoadModelParams
): Promise<void> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.model,
      keep_alive: params.keep_alive || '5m',
      prompt: '',
    }),
  });
  if (!response.ok) throw new Error('Failed to load model');
};

export const unloadModel = async (serverUrl: string, modelName: string): Promise<void> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      keep_alive: 0,
      prompt: '',
    }),
  });
  if (!response.ok) throw new Error('Failed to unload model');
};

export const deleteModel = async (serverUrl: string, modelName: string): Promise<void> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });
  if (!response.ok) throw new Error('Failed to delete model');
};

export const pullModel = async (
  serverUrl: string,
  modelName: string,
  onProgress: (progress: PullProgress) => void,
  signal?: AbortSignal
): Promise<void> => {
  const response = await fetch(`${normalizeUrl(serverUrl)}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
    signal,
  });

  if (!response.ok) throw new Error('Failed to pull model');
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const progress = JSON.parse(line) as PullProgress;
        onProgress(progress);
      } catch {
        // Skip invalid JSON lines
      }
    }
  }
};

export const createModel = async (
  serverUrl: string,
  params: CreateModelParams,
  onProgress: (progress: { status: string }) => void
): Promise<void> => {
  const payload = {
    model: params.model,
    from: params.from,
    ...(params.system && { system: params.system }),
    ...(params.parameters && { parameters: params.parameters }),
    stream: true,
  };

  const response = await fetch(`${normalizeUrl(serverUrl)}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || 'Failed to create model');
  }
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const progress = JSON.parse(line);
        if (progress.error) {
          throw new Error(progress.error);
        }
        onProgress(progress);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
};

// Helper to format bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to generate preview JSON for display
export const generateCreatePayloadPreview = (params: {
  model: string;
  from: string;
  system?: string;
  parameters?: CreateModelParams['parameters'];
}): string => {
  const payload: Record<string, unknown> = {
    model: params.model,
    from: params.from,
  };
  if (params.system) {
    payload.system = params.system;
  }
  if (params.parameters) {
    payload.parameters = params.parameters;
  }
  return JSON.stringify(payload, null, 2);
};
