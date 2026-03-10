import { useState, useEffect, useRef } from 'react';

interface QRCodeDisplayProps {
  url?: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.origin : '');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(200);

  useEffect(() => {
    if (!canvasRef.current || !currentUrl) return;
    drawQR(canvasRef.current, currentUrl, size);
  }, [currentUrl, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'cardapio-qrcode.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-foreground">QR Code do Cardápio</h3>
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center gap-4">
        <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
        <p className="text-xs text-muted-foreground text-center break-all max-w-[250px]">{currentUrl}</p>
        <div className="flex gap-2">
          <select value={size} onChange={e => setSize(Number(e.target.value))}
            className="p-2 rounded-lg border border-border bg-background text-sm text-foreground">
            <option value={150}>Pequeno</option>
            <option value={200}>Médio</option>
            <option value={300}>Grande</option>
          </select>
          <button onClick={handleDownload}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            Baixar PNG
          </button>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">Use para:</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {['🍽️ Mesas', '📱 Divulgação', '📦 Embalagens'].map(use => (
              <span key={use} className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground">{use}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple QR code generator using canvas (basic implementation)
function drawQR(canvas: HTMLCanvasElement, text: string, size: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Use a simple encoded representation via Google Charts API image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
  };
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=8`;
}
