import React, { useState } from "react";
import QRCode from "qrcode.react";
import "./QRCodeGenerator.css";

const QRCodeGenerator = ({
  bookingUrl = "https://your-ride-app.com/book",
  size = 256,
  level = "M",
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector("#qr-code canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "nela-ride-qr-code.png";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="qr-generator-container">
      <div className="qr-header">
        <h2>🚗 NELA Ride Service</h2>
        <p>Scan to book your ride instantly!</p>
      </div>

      <div className="qr-code-wrapper" id="qr-code">
        <QRCode
          value={bookingUrl}
          size={size}
          level={level}
          includeMargin={true}
          renderAs="canvas"
        />
      </div>

      <div className="qr-info">
        <p className="qr-url">{bookingUrl}</p>

        <div className="qr-actions">
          <button
            className={`action-btn copy-btn ${copied ? "copied" : ""}`}
            onClick={copyToClipboard}
          >
            {copied ? "✅ Copied!" : "📋 Copy Link"}
          </button>

          <button className="action-btn download-btn" onClick={downloadQR}>
            💾 Download QR
          </button>
        </div>
      </div>

      <div className="qr-instructions">
        <h3>How to use:</h3>
        <ul>
          <li>🖨️ Print this QR code and display it at your location</li>
          <li>📱 Customers scan with their phone camera</li>
          <li>🌐 They'll be taken to your booking website</li>
          <li>🚗 You'll receive ride requests in your driver app</li>
        </ul>
      </div>

      <div className="qr-features">
        <div className="feature">
          <span className="feature-icon">⚡</span>
          <div>
            <h4>Instant Booking</h4>
            <p>No app download required</p>
          </div>
        </div>

        <div className="feature">
          <span className="feature-icon">💰</span>
          <div>
            <h4>10-15% Discount</h4>
            <p>Better prices than competitors</p>
          </div>
        </div>

        <div className="feature">
          <span className="feature-icon">📍</span>
          <div>
            <h4>Local Service</h4>
            <p>Personalized ride experience</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
.qr-generator-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  color: white;
  text-align: center;
}

.qr-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.qr-header p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.qr-code-wrapper {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  display: inline-block;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.qr-info {
  margin-bottom: 2rem;
}

.qr-url {
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  word-break: break-all;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
}

.qr-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  background: white;
}

.copy-btn.copied {
  background: #10B981;
  color: white;
}

.qr-instructions {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.qr-instructions h3 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.qr-instructions ul {
  list-style: none;
  padding: 0;
  text-align: left;
}

.qr-instructions li {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1rem;
}

.qr-instructions li:last-child {
  border-bottom: none;
}

.qr-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.feature {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.feature:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.feature h4 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.feature p {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .qr-generator-container {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .qr-header h2 {
    font-size: 2rem;
  }
  
  .qr-code-wrapper {
    padding: 1rem;
  }
  
  .qr-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 200px;
  }
  
  .qr-features {
    grid-template-columns: 1fr;
  }
}

/* Print Styles */
@media print {
  .qr-generator-container {
    background: white;
    color: black;
    box-shadow: none;
    max-width: none;
    margin: 0;
    padding: 1rem;
  }
  
  .qr-actions,
  .qr-instructions {
    display: none;
  }
  
  .qr-header h2 {
    color: black;
    text-shadow: none;
  }
  
  .qr-url {
    background: #f0f0f0;
    color: black;
  }
  
  .qr-features {
    display: none;
  }
}
