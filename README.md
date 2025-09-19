# Nail Schedule (ネイル予約管理フロントエンドアプリ)

個人ネイリスト向けのシンプルな予約管理用フロントエンドアプリです。Next.js (App Router) を使用し、端末ローカルストレージにデータを保存します。決済などのサーバサイド機能は含みません。

## 特長
- カレンダー形式 (月表示) で日付を選択し、予定を登録
- 予約の追加・削除: 時間、タイトル (お客様名など)、メニュー、所要時間、メモ、カラーを保存
- データはブラウザの `localStorage` のみを使用 (サーバ不要)
- ダークベースのモダンなUIとモバイル操作を意識したボトムシート

## 動作要件
- Node.js 18 以上

## セットアップ & 実行
```
npm install
npm run dev   # http://localhost:3000 で開発サーバ起動
```

## フォルダ構成
- `app/page.jsx` メイン画面。月カレンダーと日別ボトムシートを定義
- `app/layout.jsx` 共通レイアウトとグローバルスタイル
- `app/globals.css` モバイル優先のスタイル定義
- `next.config.js` Next.js のグローバル設定

## 使用方法
1. 月カレンダーで任意の日付をクリック/タップ
2. ボトムシートで「時間・タイトル・メニュー・所要時間・メモ・カラー」を入力
3. 追加ボタンで予約を登録。登録済みの予定は同シートに一覧表示
4. 削除ボタンで個別の予定を削除

## データについて
- ブラウザの `localStorage` に JSON 形式で保存
- キー: `appointments_v1`
- 端末やブラウザを跨いだ同期はありません (ブラウザの同期機能やエクスポート機能の追加は今後の検討事項)

## 今後の拡張アイデア
- 週/日ビューやドラッグ&ドロップによる操作、繰り返し予約
- JSON エクスポート/インポート機能
- PWA 対応 (オフライン利用、ホーム画面追加)
- 色/テーマカスタム、勤務時間帯の表示

## AWS Amplify でのデプロイ
1. **事前準備**
   - AWS アカウントを用意し、Amplify Hosting が利用できるリージョンを確認します。
   - ローカルに AWS CLI と Amplify CLI をインストールします (`npm install -g @aws-amplify/cli`)。
   - `aws configure` または `amplify configure` でデプロイ用 IAM ユーザーのアクセスキーを設定します。
2. **Next.js の設定調整**
   - `next.config.js` から `experimental.appDir` を削除し、以下の内容に更新します。
     ```js
     /** @type {import('next').NextConfig} */
     const nextConfig = {
       output: 'standalone'
     };

     export default nextConfig;
     ```
   - `npm run build` を実行し、ビルドが成功することを確認します。
3. **Amplify プロジェクト初期化**
   - プロジェクトルート (`c:\work\sample`) で `amplify init` を実行します。
   - `? App type` は `javascript`、`? Framework` は `nextjs` を選択し、環境名 (例: `dev`) とリージョンを指定します。
4. **ホスティング設定と初回デプロイ**
   - `amplify add hosting` を実行し、「Amplify Hosting with CloudFront and S3」を選択、指示に従って設定します。
   - `amplify publish` で初回デプロイを実行します。
5. **Git 連携 (任意)**
   - Amplify Console で GitHub / CodeCommit などのリポジトリとブランチを紐付けます。
   - リポジトリ直下に `amplify.yml` を配置し、ビルド手順を明示すると安定します。
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: .next
         files:
           - '**/*'
       cache:
         paths:
           - node_modules/**/*
     ```
6. **デプロイ確認**
   - `amplify status` でカテゴリごとの状態を確認し、`amplify console hosting` で公開 URL やデプロイログを参照します。
   - ブラウザから公開 URL へアクセスし、SSR やルーティング、API 応答などをテストします。

## ライセンス
- 個人利用を前提に作成しています。必要に応じて調整してください。
# nail_scheduler_app
# nail_scheduler_app
