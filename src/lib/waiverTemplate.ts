export interface WaiverData {
  businessName: string
  customerName: string
  customerPhone: string
  dateISO: string
  signatureDataUrl: string
}

export function generateWaiverHtml(data: WaiverData): string {
  const date = new Date(data.dateISO)
  const dateStr = date.toLocaleString()

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${data.businessName} Test Ride Waiver</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #0f172a; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      h2 { font-size: 16px; margin: 16px 0 8px; }
      .meta { color: #475569; font-size: 14px; margin-bottom: 16px; }
      .section { margin: 12px 0; }
      .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
      .sig { margin-top: 24px; }
      .sig img { display: block; height: 80px; border: 1px solid #e2e8f0; background: white; padding: 4px; }
      .sigline { margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 14px; }
    </style>
  </head>
  <body>
    <h1>${data.businessName} Test Ride Waiver & Release</h1>
    <div class="meta">Signed by ${data.customerName} (Phone: ${data.customerPhone}) on ${dateStr}</div>
    <div class="section box">
      <p>
        I, the undersigned, acknowledge that riding an electric bicycle involves inherent risks, including the
        risk of serious injury. I am competent to operate a bicycle, will obey all traffic laws, and will use
        appropriate safety equipment at all times. I accept full responsibility for my actions during this
        test ride and agree to return the bicycle by the agreed time in the same condition received.
      </p>
      <p>
        I hereby release and hold harmless ${data.businessName}, its owners, employees, and affiliates from any
        and all claims, liabilities, damages, or expenses arising from or related to my participation in the
        test ride. I agree to pay for any damage or loss sustained to the bicycle due to my misuse or negligence.
      </p>
      <p>
        By signing below, I confirm that I have read, understand, and agree to the terms above.
      </p>
    </div>
    <div class="sig">
      <h2>Signature</h2>
      <img src="${data.signatureDataUrl}" alt="Signature" />
      <div class="sigline">${data.customerName} — ${dateStr}</div>
    </div>
  </body>
</html>`
}


