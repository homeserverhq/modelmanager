import { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Play,
  Square,
  Trash2,
  Info,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type OllamaModel, type RunningModel, formatBytes } from '@/lib/ollama-api';
import { cn } from '@/lib/utils';

interface ModelsLibraryProps {
  models: OllamaModel[];
  runningModels: RunningModel[];
  isLoading: boolean;
  onLoadModel: (modelName: string) => void;
  onUnloadModel: (modelName: string) => void;
  onDeleteModel: (modelName: string) => void;
  onShowDetails: (modelName: string) => void;
  loadingModel: string | null;
}

export const ModelsLibrary = ({
  models,
  runningModels,
  isLoading,
  onLoadModel,
  onUnloadModel,
  onDeleteModel,
  onShowDetails,
  loadingModel,
}: ModelsLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isModelRunning = (modelName: string) =>
    runningModels.some((rm) => rm.name === modelName);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Installed Models
            <Badge variant="secondary" className="ml-2">
              {models.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background/50 pl-9"
              />
            </div>
            <div className="flex rounded-lg border border-border bg-background/50 p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HardDrive className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {searchTerm ? 'No models match your search' : 'No models installed'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModels.map((model) => (
              <ModelCard
                key={`${model.name}-${model.digest}`}
                model={model}
                isRunning={isModelRunning(model.name)}
                isLoading={loadingModel === model.name}
                onLoad={() => onLoadModel(model.name)}
                onUnload={() => onUnloadModel(model.name)}
                onDelete={() => onDeleteModel(model.name)}
                onDetails={() => onShowDetails(model.name)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredModels.map((model) => (
              <ModelListItem
                key={`${model.name}-${model.digest}`}
                model={model}
                isRunning={isModelRunning(model.name)}
                isLoading={loadingModel === model.name}
                onLoad={() => onLoadModel(model.name)}
                onUnload={() => onUnloadModel(model.name)}
                onDelete={() => onDeleteModel(model.name)}
                onDetails={() => onShowDetails(model.name)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ModelItemProps {
  model: OllamaModel;
  isRunning: boolean;
  isLoading: boolean;
  onLoad: () => void;
  onUnload: () => void;
  onDelete: () => void;
  onDetails: () => void;
}

const ModelCard = ({
  model,
  isRunning,
  isLoading,
  onLoad,
  onUnload,
  onDelete,
  onDetails,
}: ModelItemProps) => (
  <div
    className={cn(
      'group relative rounded-lg border p-4 transition-all hover:border-primary/50',
      isRunning ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/50'
    )}
  >
    {isRunning && (
      <div className="absolute right-3 top-3">
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
      </div>
    )}
    <div className="mb-3">
      <h3 className="truncate font-semibold">{model.name}</h3>
      <p className="text-sm text-muted-foreground">{formatBytes(model.size)}</p>
    </div>
    <div className="mb-4 flex flex-wrap gap-1">
      <Badge variant="outline" className="text-xs">
        {model.details.family}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {model.details.parameter_size}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {model.details.quantization_level}
      </Badge>
    </div>
    <div className="flex gap-2">
      {isRunning ? (
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onUnload}
          disabled={isLoading}
        >
          <Square className="mr-1 h-3 w-3" />
          Unload
        </Button>
      ) : (
        <Button
          size="sm"
          className="flex-1"
          onClick={onLoad}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Play className="mr-1 h-3 w-3" />
          )}
          Load
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onDetails}>
        <Info className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{model.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
);

const ModelListItem = ({
  model,
  isRunning,
  isLoading,
  onLoad,
  onUnload,
  onDelete,
  onDetails,
}: ModelItemProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 rounded-lg border p-3 transition-all hover:border-primary/50',
      isRunning ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/50'
    )}
  >
    <div className="flex items-center gap-3 overflow-hidden">
      {isRunning && (
        <span className="flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
      )}
      <div className="overflow-hidden">
        <h3 className="truncate font-semibold">{model.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatBytes(model.size)}</span>
          <span>•</span>
          <span>{model.details.family}</span>
          <span>•</span>
          <span>{model.details.parameter_size}</span>
        </div>
      </div>
    </div>
    <div className="flex shrink-0 gap-1">
      {isRunning ? (
        <Button size="sm" variant="outline" onClick={onUnload} disabled={isLoading}>
          <Square className="mr-1 h-3 w-3" />
          Unload
        </Button>
      ) : (
        <Button size="sm" onClick={onLoad} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Play className="mr-1 h-3 w-3" />
          )}
          Load
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onDetails}>
        <Info className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{model.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
);
