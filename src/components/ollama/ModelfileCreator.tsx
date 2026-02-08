import { useState, useMemo } from 'react';
import { FileCode, Plus, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type OllamaModel, type CreateModelParams, generateCreatePayloadPreview } from '@/lib/ollama-api';

interface ModelfileCreatorProps {
  models: OllamaModel[];
  onCreate: (params: CreateModelParams) => Promise<boolean>;
  isCreating: boolean;
  status: string;
}

const CONTEXT_SIZES = [2048, 4096, 8192, 16384, 32768, 65536, 131072];

export const ModelfileCreator = ({
  models,
  onCreate,
  isCreating,
  status,
}: ModelfileCreatorProps) => {
  const [name, setName] = useState('');
  const [baseModel, setBaseModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [contextSize, setContextSize] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);
  const [repeatPenalty, setRepeatPenalty] = useState(1.1);
  const [showPreview, setShowPreview] = useState(false);

  const previewContent = useMemo(() => {
    if (!baseModel) return '';
    return generateCreatePayloadPreview({
      model: name.trim() || 'my-custom-model',
      from: baseModel,
      system: systemPrompt || undefined,
      parameters: {
        num_ctx: contextSize,
        temperature,
        top_p: topP,
        top_k: topK,
        repeat_penalty: repeatPenalty,
      },
    });
  }, [name, baseModel, systemPrompt, contextSize, temperature, topP, topK, repeatPenalty]);

  const handleCreate = async () => {
    if (!name.trim() || !baseModel) return;
    const params: CreateModelParams = {
      model: name.trim(),
      from: baseModel,
      system: systemPrompt || undefined,
      parameters: {
        num_ctx: contextSize,
        temperature,
        top_p: topP,
        top_k: topK,
        repeat_penalty: repeatPenalty,
      },
    };
    const success = await onCreate(params);
    if (success) {
      setName('');
      setSystemPrompt('');
      setTemperature(0.7);
      setTopP(0.9);
      setTopK(40);
      setRepeatPenalty(1.1);
    }
  };

  const canCreate = name.trim() && baseModel && !isCreating;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          Create Custom Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Base Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                placeholder="my-custom-model"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseModel">Base Model</Label>
              <Select value={baseModel} onValueChange={setBaseModel}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a base model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.digest} value={model.name}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextSize">Context Size</Label>
              <Select
                value={contextSize.toString()}
                onValueChange={(v) => setContextSize(parseInt(v))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTEXT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size.toLocaleString()} tokens
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="You are a helpful assistant..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[120px] bg-background/50 font-mono text-sm"
              />
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Higher values = more creative, lower = more focused
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Top P</Label>
                <span className="text-sm text-muted-foreground">{topP}</span>
              </div>
              <Slider
                value={[topP]}
                onValueChange={([v]) => setTopP(v)}
                min={0}
                max={1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Nucleus sampling threshold
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Top K</Label>
                <span className="text-sm text-muted-foreground">{topK}</span>
              </div>
              <Slider
                value={[topK]}
                onValueChange={([v]) => setTopK(v)}
                min={1}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Number of tokens to consider
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Repeat Penalty</Label>
                <span className="text-sm text-muted-foreground">{repeatPenalty}</span>
              </div>
              <Slider
                value={[repeatPenalty]}
                onValueChange={([v]) => setRepeatPenalty(v)}
                min={1}
                max={2}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Penalize repetitive outputs
              </p>
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        {isCreating && status && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {status}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!baseModel}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Modelfile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>API Request Preview</DialogTitle>
              </DialogHeader>
              <pre className="max-h-[60vh] overflow-auto rounded-lg bg-secondary p-4 font-mono text-sm">
                {previewContent || 'Select a base model to preview'}
              </pre>
            </DialogContent>
          </Dialog>

          <Button onClick={handleCreate} disabled={!canCreate}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Model
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
