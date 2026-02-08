import { useState } from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type PullProgress } from '@/lib/ollama-api';
interface PullModelProps {
  onPull: (modelName: string) => void;
  onCancel: () => void;
  isPulling: boolean;
  progress: PullProgress | null;
}
const QUANTIZATION_OPTIONS = [{
  value: 'default',
  label: 'Default (auto-select)'
}, {
  value: 'Q4_K_M',
  label: 'Q4_K_M (balanced, recommended)'
}, {
  value: 'Q4_K_S',
  label: 'Q4_K_S (smaller)'
}, {
  value: 'Q5_K_M',
  label: 'Q5_K_M (higher quality)'
}, {
  value: 'Q5_K_S',
  label: 'Q5_K_S'
}, {
  value: 'Q6_K',
  label: 'Q6_K'
}, {
  value: 'Q8_0',
  label: 'Q8_0 (highest quality, largest)'
}];
export const PullModel = ({
  onPull,
  onCancel,
  isPulling,
  progress
}: PullModelProps) => {
  // Ollama Library state
  const [modelName, setModelName] = useState('');

  // Hugging Face state
  const [hfUsername, setHfUsername] = useState('');
  const [hfRepository, setHfRepository] = useState('');
  const [hfQuantization, setHfQuantization] = useState('default');
  const handlePullOllama = () => {
    if (modelName.trim()) {
      onPull(modelName.trim());
    }
  };
  const handlePullHuggingFace = () => {
    if (hfUsername.trim() && hfRepository.trim()) {
      let modelPath = `hf.co/${hfUsername.trim()}/${hfRepository.trim()}`;
      if (hfQuantization !== 'default') {
        modelPath += `:${hfQuantization}`;
      }
      onPull(modelPath);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent, pullFn: () => void) => {
    if (e.key === 'Enter' && !isPulling) {
      pullFn();
    }
  };
  const getProgressPercent = () => {
    if (!progress?.total || !progress?.completed) return 0;
    return Math.round(progress.completed / progress.total * 100);
  };
  const canPullHuggingFace = hfUsername.trim() && hfRepository.trim();
  return <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-primary" />
          Pull New Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ollama" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ollama">Ollama Library</TabsTrigger>
            <TabsTrigger value="huggingface">Hugging Face</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ollama" className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="e.g., llama3:8b, mistral, codellama:13b" value={modelName} onChange={e => setModelName(e.target.value)} onKeyDown={e => handleKeyDown(e, handlePullOllama)} disabled={isPulling} className="bg-background/50" />
              {isPulling ? <Button onClick={onCancel} variant="destructive">
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button> : <Button onClick={handlePullOllama} disabled={!modelName.trim()}>
                  <Download className="mr-1 h-4 w-4" />
                  Pull
                </Button>}
            </div>

            <p className="text-xs text-muted-foreground">
              Browse available models at{' '}
              <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                ollama.com/library
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </TabsContent>
          
          <TabsContent value="huggingface" className="space-y-4">
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Username (e.g., bartowski)" value={hfUsername} onChange={e => setHfUsername(e.target.value)} onKeyDown={e => handleKeyDown(e, handlePullHuggingFace)} disabled={isPulling} className="bg-background/50" />
                <Input placeholder="Repository (e.g., Llama-3.2-1B-Instruct-GGUF)" value={hfRepository} onChange={e => setHfRepository(e.target.value)} onKeyDown={e => handleKeyDown(e, handlePullHuggingFace)} disabled={isPulling} className="bg-background/50" />
              </div>
              
              <div className="flex gap-2">
                <Select value={hfQuantization} onValueChange={setHfQuantization} disabled={isPulling}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select quantization" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUANTIZATION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                
                {isPulling ? <Button onClick={onCancel} variant="destructive">
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button> : <Button onClick={handlePullHuggingFace} disabled={!canPullHuggingFace}>
                    <Download className="mr-1 h-4 w-4" />
                    Pull
                  </Button>}
              </div>
              
              {canPullHuggingFace && <p className="rounded-md bg-secondary/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                  hf.co/{hfUsername}/{hfRepository}
                  {hfQuantization !== 'default' && `:${hfQuantization}`}
                </p>}
            </div>

            <p className="text-xs text-muted-foreground">
              Browse GGUF models at{' '}
              <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline" href="https://huggingface.co/models?library=gguf&apps=ollama&sort=trending">
                huggingface.co/models
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </TabsContent>
        </Tabs>

        {isPulling && progress && <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.status}</span>
              {progress.total && progress.completed && <span className="text-primary">{getProgressPercent()}%</span>}
            </div>
            {progress.total && progress.completed && <Progress value={getProgressPercent()} className="h-2" />}
          </div>}
      </CardContent>
    </Card>;
};