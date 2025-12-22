import { Config, Participant, Logos, Signature } from '@/types/certificate';

interface VisualConfig {
  nameY: number;
  nameFontSize: number;
  dateY: number;
  dateFontSize: number;
  dateX: number;
}

export class CertificateGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
      img.crossOrigin = 'anonymous';
    });
  }

  /**
   * Genera el certificado escribiendo sobre una plantilla existente
   * @param participant - Datos del participante
   * @param config - Configuración del evento
   * @param templateSrc - URL de la imagen de la plantilla
   * @param visualConfig - Configuración de posiciones y tamaños (opcional)
   */
  async generateFromTemplate(
    participant: Participant,
    config: Config,
    templateSrc: string,
    visualConfig?: VisualConfig
  ): Promise<string> {
    const defaultConfig: VisualConfig = {
      nameY: 44,
      nameFontSize: 48,
      dateY: 68,
      dateFontSize: 18,
      dateX: 85
    };

    const vc = visualConfig || defaultConfig;

    const templateImg = await this.loadImage(templateSrc);

    this.canvas.width = templateImg.width;
    this.canvas.height = templateImg.height;

    this.ctx.drawImage(templateImg, 0, 0);

    const centerX = this.canvas.width / 2;

    const nameY = (this.canvas.height * vc.nameY) / 100;
    const dateY = (this.canvas.height * vc.dateY) / 100;
    const dateX = (this.canvas.width * vc.dateX) / 100;

    const qrSize = 120;
    const qrX = 80;
    const qrY = this.canvas.height - qrSize - 50;

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `bold ${vc.nameFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(participant.nombres_apellidos.toUpperCase(), centerX, nameY);

    if (config.issueLocation && config.issueDate) {
      this.ctx.textAlign = 'right';
      this.ctx.font = `${vc.dateFontSize}px Arial`;
      this.ctx.fillStyle = '#000000';
      this.ctx.fillText(`${config.issueLocation}, ${config.issueDate}`, dateX, dateY);
    }

    if (participant.qr_code) {
      try {
        const QRCode = (await import('qrcode')).default;
        const qrDataUrl = await QRCode.toDataURL(participant.qr_code, {
          width: qrSize,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        const qrImg = await this.loadImage(qrDataUrl);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        // Dibujar QR
        this.ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';;

      } catch (error) {
        console.error('Error generating QR:', error);
      }
    }

    return this.canvas.toDataURL('image/png');
  }
}