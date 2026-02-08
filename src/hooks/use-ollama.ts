import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  getStoredServerUrl,
  setStoredServerUrl,
  checkConnection,
  getModels,
  getRunningModels,
  getModelDetails,
  loadModel,
  unloadModel,
  deleteModel,
  pullModel,
  createModel,
  type OllamaModel,
  type RunningModel,
  type ModelDetails,
  type PullProgress,
  type CreateModelParams,
} from '@/lib/ollama-api';
import { useToast } from '@/hooks/use-toast';

export const useOllamaConnection = () => {
  const [serverUrl, setServerUrlState] = useState(getStoredServerUrl);
  const { toast } = useToast();

  const setServerUrl = useCallback((url: string) => {
    setServerUrlState(url);
    setStoredServerUrl(url);
  }, []);

  const connectionQuery = useQuery({
    queryKey: ['ollama-connection', serverUrl],
    queryFn: () => checkConnection(serverUrl),
    enabled: !!serverUrl,
    refetchInterval: 10000,
    retry: false,
  });

  return {
    serverUrl,
    setServerUrl,
    isConnected: connectionQuery.data ?? false,
    isChecking: connectionQuery.isLoading,
    checkConnection: connectionQuery.refetch,
  };
};

export const useOllamaModels = (serverUrl: string, enabled: boolean) => {
  return useQuery<OllamaModel[]>({
    queryKey: ['ollama-models', serverUrl],
    queryFn: () => getModels(serverUrl),
    enabled: enabled && !!serverUrl,
    refetchInterval: 30000,
  });
};

export const useRunningModels = (serverUrl: string, enabled: boolean) => {
  return useQuery<RunningModel[]>({
    queryKey: ['ollama-running', serverUrl],
    queryFn: () => getRunningModels(serverUrl),
    enabled: enabled && !!serverUrl,
    refetchInterval: 5000,
  });
};

export const useModelDetails = (serverUrl: string, modelName: string, enabled: boolean) => {
  return useQuery<ModelDetails>({
    queryKey: ['ollama-model-details', serverUrl, modelName],
    queryFn: () => getModelDetails(serverUrl, modelName),
    enabled: enabled && !!serverUrl && !!modelName,
  });
};

export const useLoadModel = (serverUrl: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { model: string; keepAlive?: string }) =>
      loadModel(serverUrl, { model: params.model, keep_alive: params.keepAlive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ollama-running'] });
      toast({
        title: 'Model Loaded',
        description: `${variables.model} has been loaded into memory.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Load Model',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUnloadModel = (serverUrl: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (modelName: string) => unloadModel(serverUrl, modelName),
    onSuccess: (_, modelName) => {
      queryClient.invalidateQueries({ queryKey: ['ollama-running'] });
      toast({
        title: 'Model Unloaded',
        description: `${modelName} has been unloaded from memory.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Unload Model',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteModel = (serverUrl: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (modelName: string) => deleteModel(serverUrl, modelName),
    onSuccess: (_, modelName) => {
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      queryClient.invalidateQueries({ queryKey: ['ollama-running'] });
      toast({
        title: 'Model Deleted',
        description: `${modelName} has been deleted.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Model',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const usePullModel = (serverUrl: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [progress, setProgress] = useState<PullProgress | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const pull = useCallback(async (modelName: string) => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsPulling(true);
    setProgress({ status: 'Starting pull...' });

    try {
      await pullModel(serverUrl, modelName, setProgress, controller.signal);
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      toast({
        title: 'Model Pulled',
        description: `${modelName} has been downloaded successfully.`,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: 'Failed to Pull Model',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsPulling(false);
      setProgress(null);
      setAbortController(null);
    }
  }, [serverUrl, queryClient, toast]);

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      toast({
        title: 'Pull Cancelled',
        description: 'Model download has been cancelled.',
      });
    }
  }, [abortController, toast]);

  return { pull, cancel, progress, isPulling };
};

export const useCreateModel = (serverUrl: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const create = useCallback(async (params: CreateModelParams) => {
    setIsCreating(true);
    setStatus('Starting creation...');

    try {
      await createModel(serverUrl, params, (progress) => setStatus(progress.status));
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      toast({
        title: 'Model Created',
        description: `${params.model} has been created successfully.`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to Create Model',
        description: (error as Error).message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCreating(false);
      setStatus('');
    }
  }, [serverUrl, queryClient, toast]);

  return { create, status, isCreating };
};
