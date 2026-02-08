import { Cpu, HardDrive, Zap, Activity, MemoryStick } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { type RunningModel, formatBytes } from '@/lib/ollama-api';
import { cn } from '@/lib/utils';

interface SystemStatusProps {
  isConnected: boolean;
  runningModels: RunningModel[];
  isLoading: boolean;
}

export const SystemStatus = ({
  isConnected,
  runningModels,
  isLoading,
}: SystemStatusProps) => {
  const activeModel = runningModels[0];

  // Parse GPU/CPU layers from model info if available
  const getGpuCpuInfo = () => {
    if (!activeModel) return { gpuLayers: 0, cpuLayers: 0, total: 0 };
    // This is estimated since Ollama doesn't directly expose this
    // In reality, VRAM usage indicates GPU offloading
    const vramRatio = activeModel.size_vram / (activeModel.size || 1);
    const gpuLayers = Math.round(vramRatio * 100);
    return { gpuLayers, cpuLayers: 100 - gpuLayers, total: 100 };
  };

  const gpuCpu = getGpuCpuInfo();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Connection Status */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                isConnected ? 'bg-primary animate-pulse' : 'bg-destructive'
              )}
            />
            <span className="text-lg font-semibold">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeModel ? 'Model loaded' : 'No model loaded'}
          </p>
        </CardContent>
      </Card>

      {/* Current Model */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            Active Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="truncate text-lg font-semibold">
            {activeModel?.name || '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeModel
              ? `${activeModel.details.parameter_size} • ${activeModel.details.quantization_level}`
              : 'No model in memory'}
          </p>
        </CardContent>
      </Card>

      {/* GPU/CPU Split */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Cpu className="h-4 w-4" />
            GPU/CPU Split
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeModel ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary">{gpuCpu.gpuLayers}% GPU</span>
                <span className="text-accent">{gpuCpu.cpuLayers}% CPU</span>
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="bg-primary transition-all"
                  style={{ width: `${gpuCpu.gpuLayers}%` }}
                />
                <div
                  className="bg-accent transition-all"
                  style={{ width: `${gpuCpu.cpuLayers}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MemoryStick className="h-4 w-4" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeModel ? (
            <>
              <p className="text-lg font-semibold">
                {formatBytes(activeModel.size_vram)} VRAM
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total: {formatBytes(activeModel.size)}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
