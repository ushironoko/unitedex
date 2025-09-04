import type React from "react";
import { useState, useRef } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { PokemonData, CustomDataError } from "../types";

interface DataManagerProps {
  isCustomData: boolean;
  uploadCustomData: (data: PokemonData) => Promise<void>;
  resetToDefault: () => void;
  downloadDefaultData: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({
  isCustomData,
  uploadCustomData,
  resetToDefault,
  downloadDefaultData,
}) => {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<CustomDataError | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as PokemonData;
      await uploadCustomData(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        const customError = err as CustomDataError;
        setError(customError);
      } else {
        setError({
          message: "データのアップロードに失敗しました",
          details: ["ファイルの形式が正しくない可能性があります"],
        });
      }
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="data-manager">
      <div className="data-manager-header">
        <h3>データ管理</h3>
        {isCustomData && (
          <span className="custom-data-indicator">
            <CheckCircle size={16} />
            カスタムデータ使用中
          </span>
        )}
      </div>

      <p className="data-manager-description">
        有利不利のデータはカスタマイズできます。ダウンロードしたファイルを編集後、アップロードすることでブラウザに保存されます。
      </p>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="toggle-button"
      >
        {isOpen ? <ChevronUp /> : <ChevronDown />}
        データ管理メニュー
      </button>

      {isOpen && (
        <div className="data-manager-actions">
          <button
            type="button"
            onClick={downloadDefaultData}
            className="data-manager-button download-button"
            title="デフォルトデータをダウンロード"
          >
            <Download size={18} />
            <span>デフォルトデータをダウンロード</span>
          </button>

          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="data-manager-button upload-button"
            title="カスタムデータをアップロード"
          >
            <Upload size={18} />
            <span>
              {uploading ? "アップロード中..." : "カスタムデータをアップロード"}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          {isCustomData && (
            <button
              type="button"
              onClick={resetToDefault}
              className="data-manager-button reset-button"
              title="デフォルトに戻す"
            >
              <RotateCcw size={18} />
              <span>デフォルトに戻す</span>
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="data-manager-message success-message">
          <CheckCircle size={16} />
          カスタムデータが正常にアップロードされました
        </div>
      )}

      {error && (
        <div className="data-manager-message error-message">
          <AlertCircle size={16} />
          <div>
            <div className="error-main">{error.message}</div>
            {error.details && (
              <ul className="error-details">
                {error.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <style>{`
        .data-manager {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .data-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .data-manager-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .custom-data-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-size: 14px;
          font-weight: 500;
        }

        .data-manager-description {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .toggle-button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .data-manager-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .data-manager-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .data-manager-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .data-manager-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .download-button:hover:not(:disabled) {
          color: #3b82f6;
          border-color: #3b82f6;
        }

        .upload-button:hover:not(:disabled) {
          color: #10b981;
          border-color: #10b981;
        }

        .reset-button:hover:not(:disabled) {
          color: #f59e0b;
          border-color: #f59e0b;
        }

        .data-manager-message {
          margin-top: 12px;
          padding: 12px;
          border-radius: 6px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 14px;
        }

        .success-message {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .error-main {
          font-weight: 500;
        }

        .error-details {
          margin: 8px 0 0 0;
          padding-left: 20px;
          font-size: 13px;
        }

        @media (max-width: 640px) {
          .data-manager-button span {
            display: none;
          }

          .data-manager-actions {
            justify-content: space-between;
          }

          .data-manager-button {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};
