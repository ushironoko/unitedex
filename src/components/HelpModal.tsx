import type React from "react";
import { memo, useEffect, useRef } from "react";
import {
  X,
  Search,
  Filter,
  List,
  MousePointer,
  Database,
  Smartphone,
} from "lucide-react";
import "../styles/HelpModal.css";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = memo(({ isOpen, onClose }) => {
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      // スクロール位置を保存
      scrollPositionRef.current =
        window.pageYOffset || document.documentElement.scrollTop;

      // スクロールバーの幅を計算（レイアウトシフトを防ぐため）
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // body要素のスタイルを設定
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      // iOS Safari対策
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = "100%";
      }
    } else {
      // スタイルをリセット
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // iOS Safari対策のリセット
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    // クリーンアップ関数
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="help-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      aria-label="モーダルを閉じる"
    >
      <div
        className="help-modal-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="help-modal-header">
          <h2 id="help-modal-title">Unite Graph 使い方ガイド</h2>
          <button
            type="button"
            className="help-modal-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>

        <div className="help-modal-content">
          <div className="help-section">
            <div className="help-section-header">
              <Search size={20} />
              <h3>ポケモン検索</h3>
            </div>
            <div className="help-section-content">
              <p>ポケモンを検索して有利不利関係を確認できます。</p>
              <ul>
                <li>
                  <strong>複数検索：</strong>
                  カンマ区切りで複数のポケモン指定
                  <div className="help-example">
                    例：ピカチュウ,リザードン,フシギバナ
                  </div>
                </li>
                <li>
                  <strong>技指定検索：</strong>
                  技名を指定して技ごとに検索
                  <div className="help-example">
                    例：ピカチュウ (10まんボルト)
                  </div>
                  <div className="help-note">
                    ※ポケモン名と技名の間に半角スペースが必要です
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="help-section">
            <div className="help-section-header">
              <Filter size={20} />
              <h3>グラフフィルタリング</h3>
            </div>
            <div className="help-section-content">
              <div className="help-warning">
                <Smartphone size={16} />
                <span>スマートフォンではグラフ表示機能は使用できません</span>
              </div>
              <p>グラフの表示をカスタマイズできます。</p>
              <ul>
                <li>
                  <strong>エッジフィルター：</strong>
                  <ul>
                    <li>すべて - 有利・不利両方の関係を表示</li>
                    <li>有利のみ - 緑色の矢印（有利な関係）のみ表示</li>
                    <li>不利のみ - 赤色の矢印（不利な関係）のみ表示</li>
                  </ul>
                </li>
                <li>
                  <strong>ロールフィルター：</strong>
                  各ロールのポケモンの表示/非表示を切り替え
                </li>
                <li>
                  <strong>直接接続のみ表示：</strong>
                  選択ポケモンと直接関係のあるポケモンのみ表示
                </li>
              </ul>
            </div>
          </div>

          <div className="help-section">
            <div className="help-section-header">
              <List size={20} />
              <h3>有利不利一覧UI</h3>
            </div>
            <div className="help-section-content">
              <p>
                選択したポケモンに対する有利・不利なポケモンをリスト表示します。
              </p>
              <ul>
                <li>
                  <strong>記号の意味：</strong>
                  <ul>
                    <li>○ - 有利（1つの選択ポケモンに対して有利）</li>
                    <li>◎ - 強く有利（複数の選択ポケモンに対して有利）</li>
                    <li>△ - 不利（1つの選択ポケモンに対して不利）</li>
                    <li>× - 強く不利（複数の選択ポケモンに対して不利）</li>
                  </ul>
                </li>
                <li>
                  <strong>複合関係：</strong>
                  有利と不利の両方の関係がある場合は両方の記号を表示
                </li>
              </ul>
            </div>
          </div>

          <div className="help-section">
            <div className="help-section-header">
              <MousePointer size={20} />
              <h3>ポップオーバー詳細表示</h3>
            </div>
            <div className="help-section-content">
              <p>
                有利不利一覧の各項目にマウスをホバー（モバイルではタップ）すると詳細が表示されます。
              </p>
              <ul>
                <li>選択中のどのポケモンに対して有利/不利なのか</li>
                <li>関係の内訳</li>
              </ul>
            </div>
          </div>

          <div className="help-section">
            <div className="help-section-header">
              <Database size={20} />
              <h3>データのカスタマイズ</h3>
            </div>
            <div className="help-section-content">
              <p>有利不利データをカスタマイズできます。</p>
              <ol>
                <li>
                  <strong>デフォルトデータをダウンロード</strong>
                  <div className="help-note">
                    JSONファイルとしてダウンロードされます
                  </div>
                </li>
                <li>
                  <strong>JSONファイルを編集</strong>
                  <div className="help-note">
                    nodes（ポケモン情報）とedges（関係性）を追記、編集できます
                  </div>
                </li>
                <li>
                  <strong>カスタムデータをアップロード</strong>
                  <div className="help-note">
                    編集したファイルをアップロードするとブラウザに保存されます
                  </div>
                </li>
                <li>
                  <strong>デフォルトに戻す</strong>
                  <div className="help-note">
                    カスタムデータを削除して初期状態に戻します
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="help-section">
            <div className="help-section-header">
              <h3>グラフの見方（PC版）</h3>
            </div>
            <div className="help-section-content">
              <ul>
                <li>
                  <strong>ノード（円）：</strong>各ポケモンを表します
                  <ul>
                    <li>クリックやドラッグで移動可能</li>
                  </ul>
                </li>
                <li>
                  <strong>エッジ（矢印）：</strong>ポケモン間の関係を表します
                  <ul>
                    <li>緑色 - 有利な関係</li>
                    <li>赤色 - 不利な関係</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

HelpModal.displayName = "HelpModal";

export default HelpModal;
