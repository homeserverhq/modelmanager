import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type ModelDetails, formatBytes } from '@/lib/ollama-api';
import { Loader2 } from 'lucide-react';

interface ModelDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  details: ModelDetails | undefined;
  isLoading: boolean;
}

export const ModelDetailsDialog = ({
  open,
  onOpenChange,
  modelName,
  details,
  isLoading,
}: ModelDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{modelName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="flex flex-wrap gap-2">
              <Badge>{details.details.family}</Badge>
              <Badge variant="outline">{details.details.parameter_size}</Badge>
              <Badge variant="outline">{details.details.quantization_level}</Badge>
              <Badge variant="secondary">{details.details.format}</Badge>
            </div>

            {/* Parameters */}
            {details.parameters && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 font-semibold">Parameters</h3>
                  <pre className="rounded-lg bg-secondary p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
                    {details.parameters}
                  </pre>
                </div>
              </>
            )}

            {/* Template */}
            {details.template && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 font-semibold">Template</h3>
                  <pre className="max-h-48 overflow-y-auto rounded-lg bg-secondary p-4 font-mono text-xs whitespace-pre-wrap break-words overflow-x-hidden">
                    {details.template}
                  </pre>
                </div>
              </>
            )}

            {/* Modelfile */}
            {details.modelfile && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 font-semibold">Modelfile</h3>
                  <pre className="max-h-48 overflow-y-auto rounded-lg bg-secondary p-4 font-mono text-xs whitespace-pre-wrap break-words overflow-x-hidden">
                    {details.modelfile}
                  </pre>
                </div>
              </>
            )}

            {/* Model Info */}
            {details.model_info && Object.keys(details.model_info).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 font-semibold">Additional Info</h3>
                  <div className="grid gap-2 text-sm">
                    {Object.entries(details.model_info).slice(0, 10).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">{key}</span>
                        <span className="font-mono text-right break-all">
                          {typeof value === 'number'
                            ? value.toLocaleString()
                            : String(value).slice(0, 50)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Failed to load model details
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
