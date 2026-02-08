import { useState } from 'react';
import { Server, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConnectionPanelProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  isConnected: boolean;
  isChecking: boolean;
  onCheckConnection: () => void;
}

export const ConnectionPanel = ({
  serverUrl,
  onServerUrlChange,
  isConnected,
  isChecking,
  onCheckConnection,
}: ConnectionPanelProps) => {
  const [inputValue, setInputValue] = useState(serverUrl);

  const handleConnect = () => {
    onServerUrlChange(inputValue);
    setTimeout(onCheckConnection, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isConnected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Ollama Server</h2>
              <div className="flex items-center gap-2 text-xs">
                {isChecking ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Checking...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-primary" />
                    <span className="text-primary">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 gap-2 sm:max-w-md">
            <Input
              type="text"
              placeholder="https://ollama.example.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background/50"
            />
            <Button
              onClick={handleConnect}
              disabled={isChecking || !inputValue}
              className="shrink-0"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
