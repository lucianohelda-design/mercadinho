'use client'
import { useEffect, useRef, useState } from 'react'

type Props = { onDetected: (code: string) => void }

export default function Scanner({ onDetected }: Props) {
  const [erro, setErro] = useState('')
  const started = useRef(false)

  useEffect(() => {
    let scanner: any
    async function start() {
      try {
        const mod: any = await import('html5-qrcode')
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod
        scanner = new Html5Qrcode('reader')
        started.current = true
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39
            ]
          },
          (decoded: string) => {
            if (navigator.vibrate) navigator.vibrate(80)
            onDetected(decoded)
          },
          () => {}
        )
      } catch (e: any) {
        setErro('Não foi possível abrir a câmera. Confira a permissão do navegador e se está usando HTTPS.')
      }
    }
    start()
    return () => {
      if (scanner && started.current) scanner.stop().catch(() => {})
    }
  }, [onDetected])

  return <div>
    <div id="reader" className="scanner-box" />
    {erro && <p className="alert mt-2">{erro}</p>}
  </div>
}
