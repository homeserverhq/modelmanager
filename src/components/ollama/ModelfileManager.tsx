import { useState } from 'react';
import { FileCode, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type OllamaModel, type ModelDetails } from '@/lib/ollama-api';
import { cn } from '@/lib/utils';

interface ModelfileManagerProps {
  models: OllamaModel[];
  modelDetails: Record<string, ModelDetails>;
  onDelete: (modelName: string) => void;
  onDuplicate: (modelName: string, modelfile: string) => void;
  onFetchDetails: (modelName: string) => void;
  sessionCreatedModels?: string[];
}

// Standard model tags that indicate it's from the Ollama library
const STANDARD_TAGS = [
  ':latest',
  ':7b', ':8b', ':13b', ':14b', ':32b', ':70b', ':72b', ':90b', ':405b',
  ':7b-instruct', ':8b-instruct', ':70b-instruct',
  ':7b-chat', ':8b-chat',
  ':q4_0', ':q4_1', ':q5_0', ':q5_1', ':q8_0',
  ':fp16', ':fp32',
];

// Check if a model appears to be custom (not from standard library)
const isCustomModel = (model: OllamaModel, sessionCreatedModels: string[] = []): boolean => {
  // If it was created in this session, it's definitely custom
  if (sessionCreatedModels.includes(model.name)) {
    return true;
  }
  
  // If parent_model is set, it's custom
  if (model.details.parent_model && model.details.parent_model !== '') {
    return true;
  }
  
  // Check if the model name has a standard tag - if not, it might be custom
  const hasStandardTag = STANDARD_TAGS.some(tag => 
    model.name.toLowerCase().endsWith(tag)
  );
  
  // Models without a colon are usually custom (e.g., "my-assistant")
  // unless they're well-known base names
  const hasNoTag = !model.name.includes(':');
  const knownBaseModels = ['llama2', 'llama3', 'mistral', 'mixtral', 'codellama', 'phi', 'gemma', 'qwen', 'deepseek'];
  const isKnownBase = knownBaseModels.some(base => model.name.toLowerCase() === base);
  
  if (hasNoTag && !isKnownBase) {
    return true;
  }
  
  return false;
};

export const ModelfileManager = ({
  models,
  modelDetails,
  onDelete,
  onDuplicate,
  onFetchDetails,
  sessionCreatedModels = [],
}: ModelfileManagerProps) => {
  // Filter to show custom models using enhanced detection
  const customModels = models.filter(model => isCustomModel(model, sessionCreatedModels));

  if (customModels.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Custom Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileCode className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No custom models created yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the creator above to make your first custom model
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          Custom Models
          <Badge variant="secondary" className="ml-2">
            {customModels.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customModels.map((model) => (
            <ModelfileItem
              key={`${model.name}-${model.digest}`}
              model={model}
              details={modelDetails[model.name]}
              onDelete={() => onDelete(model.name)}
              onDuplicate={(modelfile) => onDuplicate(model.name, modelfile)}
              onFetchDetails={() => onFetchDetails(model.name)}
              isSessionCreated={sessionCreatedModels.includes(model.name)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface ModelfileItemProps {
  model: OllamaModel;
  details?: ModelDetails;
  onDelete: () => void;
  onDuplicate: (modelfile: string) => void;
  onFetchDetails: () => void;
  isSessionCreated?: boolean;
}

const ModelfileItem = ({
  model,
  details,
  onDelete,
  onDuplicate,
  onFetchDetails,
  isSessionCreated,
}: ModelfileItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !details) {
      onFetchDetails();
    }
  };

  // Extract system prompt from modelfile if available
  const systemPrompt = details?.modelfile
    ?.match(/SYSTEM\s+"""([^"]*)"""/)?.[1]
    ?.trim();

  const parentModel = model.details.parent_model || 'Unknown base model';

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpen}>
      <div
        className={cn(
          'rounded-lg border transition-all',
          isOpen ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/50'
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-secondary/30">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileCode className="h-5 w-5 shrink-0 text-primary" />
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{model.name}</h3>
                  {isSessionCreated && (
                    <Badge variant="outline" className="text-xs">New</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on: {parentModel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Custom Model</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{model.name}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 pb-4 pt-3">
            {details ? (
              <div className="space-y-4">
                {systemPrompt && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      System Prompt
                    </h4>
                    <p className="rounded-lg bg-secondary p-3 text-sm">
                      {systemPrompt}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Modelfile
                  </h4>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-secondary p-3 font-mono text-xs">
                    {details.modelfile}
                  </pre>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDuplicate(details.modelfile)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading details...</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
