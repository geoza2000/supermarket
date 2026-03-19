import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X, SwitchCamera, Keyboard } from 'lucide-react';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
  onManualEntry?: () => void;
}

const BARCODE_FORMATS: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
];

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  onManualEntry,
}: BarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );
  const mountedRef = useRef(true);

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const stopScanner = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startScanner = useCallback(async (facing: string) => {
    setStarting(true);
    setError(null);

    try {
      if (!('BarcodeDetector' in window)) {
        throw new Error(
          'Barcode scanning is not supported in this browser. Please use Safari or Chrome.'
        );
      }

      const detector = new BarcodeDetector({ formats: BARCODE_FORMATS });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      try {
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
          focusMode?: string[];
        };
        if (capabilities?.focusMode?.includes('continuous')) {
          await track.applyConstraints({
            advanced: [
              { focusMode: 'continuous' } as MediaTrackConstraintSet,
            ],
          });
        }
      } catch {
        // Focus constraints not supported
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (mountedRef.current) {
          setHasMultipleCameras(videoInputs.length > 1);
        }
      } catch {
        // Can't enumerate devices
      }

      const video = videoRef.current;
      if (!video || !mountedRef.current) return;

      video.srcObject = stream;
      await video.play();

      if (mountedRef.current) setStarting(false);

      scanningRef.current = true;
      const detectLoop = async () => {
        while (scanningRef.current && mountedRef.current) {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0 && scanningRef.current) {
                scanningRef.current = false;
                onScanRef.current(barcodes[0].rawValue);
                onOpenChangeRef.current(false);
                return;
              }
            } catch {
              // Detection failed, retry next frame
            }
          }
          await new Promise((r) => requestAnimationFrame(r));
        }
      };

      detectLoop();
    } catch (err) {
      if (mountedRef.current) {
        console.error('Barcode scanner error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not access camera. Please allow camera permissions.'
        );
        setStarting(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    mountedRef.current = true;
    startScanner(facingMode);

    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [open, facingMode, startScanner, stopScanner]);

  const handleSwitchCamera = () => {
    stopScanner();
    setFacingMode((prev) =>
      prev === 'environment' ? 'user' : 'environment'
    );
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>div:first-child]:hidden">
        <ResponsiveDialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <ResponsiveDialogTitle>Scan Barcode</ResponsiveDialogTitle>
            <div className="flex items-center gap-1">
              {hasMultipleCameras && !starting && !error && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSwitchCamera}
                  title="Switch camera"
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div className="px-4 pb-4">
          <div
            className="relative rounded-lg overflow-hidden bg-black"
            style={{ minHeight: 250 }}
          >
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              style={{
                display: starting ? 'none' : 'block',
                maxHeight: '60vh',
                objectFit: 'cover',
              }}
              playsInline
              muted
              autoPlay
            />

            {starting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}

          {!starting && !error && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Point the camera at a barcode
            </p>
          )}

          {onManualEntry && (
            <Button
              variant="ghost"
              className="w-full mt-3 text-muted-foreground"
              onClick={onManualEntry}
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Type manually instead
            </Button>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
