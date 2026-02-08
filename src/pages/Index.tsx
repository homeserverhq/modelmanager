import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionPanel, SystemStatus, ModelsLibrary, PullModel, ModelfileCreator, ModelDetailsDialog } from '@/components/ollama';
import { useOllamaConnection, useOllamaModels, useRunningModels, useModelDetails, useLoadModel, useUnloadModel, useDeleteModel, usePullModel, useCreateModel } from '@/hooks/use-ollama';
import { type ModelDetails, type CreateModelParams } from '@/lib/ollama-api';
import { useToast } from '@/hooks/use-toast';
const Index = () => {
  const {
    toast
  } = useToast();
  const {
    serverUrl,
    setServerUrl,
    isConnected,
    isChecking,
    checkConnection
  } = useOllamaConnection();

  // Data queries
  const {
    data: models = [],
    isLoading: modelsLoading,
    refetch: refetchModels
  } = useOllamaModels(serverUrl, isConnected);
  const {
    data: runningModels = [],
    isLoading: runningLoading
  } = useRunningModels(serverUrl, isConnected);

  // Mutations
  const loadModel = useLoadModel(serverUrl);
  const unloadModel = useUnloadModel(serverUrl);
  const deleteModel = useDeleteModel(serverUrl);
  const {
    pull,
    cancel,
    progress,
    isPulling
  } = usePullModel(serverUrl);
  const {
    create,
    status: createStatus,
    isCreating
  } = useCreateModel(serverUrl);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshModels = useCallback(async () => {
    setIsRefreshing(true);
    await refetchModels();
    setIsRefreshing(false);
    toast({
      title: 'Models Refreshed',
      description: 'Model list has been updated.'
    });
  }, [refetchModels, toast]);
  const handleCreateModel = useCallback(async (params: CreateModelParams): Promise<boolean> => {
    return await create(params);
  }, [create]);

  // Model details state
  const [selectedModelForDetails, setSelectedModelForDetails] = useState<string>('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [modelDetailsCache, setModelDetailsCache] = useState<Record<string, ModelDetails>>({});
  const {
    data: currentModelDetails,
    isLoading: detailsLoading
  } = useModelDetails(serverUrl, selectedModelForDetails, isConnected && !!selectedModelForDetails);

  // Loading state for individual models
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const handleLoadModel = useCallback(async (modelName: string) => {
    setLoadingModel(modelName);
    try {
      await loadModel.mutateAsync({
        model: modelName
      });
    } finally {
      setLoadingModel(null);
    }
  }, [loadModel]);
  const handleShowDetails = useCallback((modelName: string) => {
    setSelectedModelForDetails(modelName);
    setDetailsDialogOpen(true);
  }, []);

  // Update cache when details are fetched
  if (currentModelDetails && selectedModelForDetails && !modelDetailsCache[selectedModelForDetails]) {
    setModelDetailsCache(prev => ({
      ...prev,
      [selectedModelForDetails]: currentModelDetails
    }));
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Model Manager v1</h1>
              <p className="text-xs text-muted-foreground">Model Manager for Ollama</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto space-y-6 px-4 py-6">
        {/* Connection Panel */}
        <ConnectionPanel serverUrl={serverUrl} onServerUrlChange={setServerUrl} isConnected={isConnected} isChecking={isChecking} onCheckConnection={() => checkConnection()} />

        {isConnected ? <>
            {/* System Status */}
            <SystemStatus isConnected={isConnected} runningModels={runningModels} isLoading={runningLoading} />

            {/* Pull Model & Modelfile Creator - Above Installed Models */}
            <div className="grid gap-6 lg:grid-cols-2">
              <PullModel onPull={pull} onCancel={cancel} isPulling={isPulling} progress={progress} />
              <ModelfileCreator models={models} onCreate={handleCreateModel} isCreating={isCreating} status={createStatus} />
            </div>

            {/* Models Library with Refresh Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Installed Models</h2>
              <Button variant="outline" size="sm" onClick={handleRefreshModels} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <ModelsLibrary models={models} runningModels={runningModels} isLoading={modelsLoading} onLoadModel={handleLoadModel} onUnloadModel={name => unloadModel.mutate(name)} onDeleteModel={name => deleteModel.mutate(name)} onShowDetails={handleShowDetails} loadingModel={loadingModel} />
          </> : <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold">Connect to Ollama</h2>
            <p className="max-w-md text-muted-foreground">
              Enter your Ollama server URL above to start managing your models.
              Make sure Ollama is running and accessible from this device.
            </p>
            <div className="mt-6 rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Example:</strong> https://ollama.example.com or http://192.168.1.100:11434
              </p>
            </div>
          </div>}

        {/* Model Details Dialog */}
        <ModelDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} modelName={selectedModelForDetails} details={modelDetailsCache[selectedModelForDetails] || currentModelDetails} isLoading={detailsLoading && !modelDetailsCache[selectedModelForDetails]} />
      </main>
    </div>;
};
export default Index;