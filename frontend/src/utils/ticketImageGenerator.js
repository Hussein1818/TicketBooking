export const generateTicketImage = ({
  bookingId,
  eventName,
  eventDate,
  seatNumber,
  amountPaid,
  eventImage,
  username
}) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    if (eventImage) bgImg.src = eventImage;

    let rendered = false;
    const renderTicketCanvas = () => {
      if (rendered) return;
      rendered = true;

      // 1. Dark Base Background
      ctx.fillStyle = "#0B0C0E";
      ctx.beginPath();
      ctx.roundRect(0, 0, 1200, 640, 36);
      ctx.fill();

      // 2. Draw Event Cover Image if loaded
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.32;
        ctx.beginPath();
        ctx.roundRect(0, 0, 1200, 640, 36);
        ctx.clip();
        ctx.drawImage(bgImg, 0, 0, 1200, 640);
        ctx.restore();
      }

      // 3. Dark Gradient Overlay
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 0);
      bgGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      bgGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.8)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0.3)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.roundRect(0, 0, 1200, 640, 36);
      ctx.fill();

      // 4. Teal Glow Accent Top Left
      const radialGlow = ctx.createRadialGradient(100, 100, 10, 100, 100, 350);
      radialGlow.addColorStop(0, "rgba(20, 184, 166, 0.35)");
      radialGlow.addColorStop(1, "rgba(20, 184, 166, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, 600, 600);

      // 5. Outer Card Border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(2, 2, 1196, 636, 34);
      ctx.stroke();

      // 6. Ticket Stub Side Notches (Left & Right Cutouts at y = 470)
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(0, 470, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1200, 470, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. Event Title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 52px sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 15;
      ctx.fillText(eventName || "Event Ticket", 64, 120);
      ctx.shadowBlur = 0;

      // 8. Event Date & Time
      const dateStr = eventDate ? new Date(eventDate).toLocaleString() : "TBA";
      ctx.fillStyle = "#14B8A6";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("📅", 64, 175);
      ctx.fillStyle = "#E4E4E7";
      ctx.font = "600 24px sans-serif";
      ctx.fillText(dateStr, 104, 175);

      // 9. Booking Pill Tag (Top Right)
      ctx.fillStyle = "rgba(20, 184, 166, 0.12)";
      ctx.beginPath();
      ctx.roundRect(830, 60, 300, 52, 26);
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 184, 166, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(830, 60, 300, 52, 26);
      ctx.stroke();
      ctx.fillStyle = "#14B8A6";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`BOOKING #${String(bookingId || "000000").slice(-6)}`, 860, 93);

      // 10. Dashed Divider Line (at y = 470)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(50, 470);
      ctx.lineTo(1150, 470);
      ctx.stroke();
      ctx.setLineDash([]);

      // 11. Seat Info
      ctx.fillStyle = "#71717A";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("SEAT", 64, 280);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText(String(seatNumber || "-"), 64, 335);

      // 12. Paid Amount Info
      if (amountPaid !== undefined && amountPaid !== null) {
        ctx.fillStyle = "#71717A";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("PAID", 320, 280);
        ctx.fillStyle = "#14B8A6";
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(`EGP ${Number(amountPaid).toLocaleString()}`, 320, 335);
      }

      // 13. QR Code Card Container (Top Right)
      const qrElement = (bookingId ? document.getElementById(`qr-${bookingId}`) : null) || document.querySelector("svg");
      if (qrElement) {
        try {
          const xml = new XMLSerializer().serializeToString(qrElement);
          const svg64 = btoa(unescape(encodeURIComponent(xml)));
          const qrImage = new Image();
          qrImage.src = "data:image/svg+xml;base64," + svg64;
          qrImage.onload = () => {
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.roundRect(860, 170, 240, 240, 28);
            ctx.fill();
            ctx.drawImage(qrImage, 880, 190, 200, 200);
            triggerSave();
          };
          qrImage.onerror = () => triggerSave();
        } catch {
          triggerSave();
        }
      } else {
        triggerSave();
      }
    };

    function triggerSave() {
      const link = document.createElement("a");
      const safeName = (eventName || "Event").replace(/\s+/g, "_");
      link.download = `Ticket_${safeName}_${bookingId || Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve();
    }

    if (eventImage) {
      bgImg.onload = renderTicketCanvas;
      bgImg.onerror = renderTicketCanvas;
      setTimeout(renderTicketCanvas, 800);
    } else {
      renderTicketCanvas();
    }
  });
};
