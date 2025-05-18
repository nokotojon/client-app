# Slay the Spire ランデータアナライザー

Slay the Spire のゲームデータを分析するためのアプリケーションです。プレイ履歴から統計情報やパフォーマンス分析を行えます。

## 機能

- Slay the Spire の run ファイル（.run および.json）の読み込み
- ゲームデータの概要表示
- （将来的に）キャラクター別、アセンション別の統計情報
- （将来的に）デッキ分析やルート選択の分析

## 開発環境のセットアップ

### 前提条件

- Docker
- Docker Compose
- Node.js（ローカル開発時）

### インストールと実行

1. リポジトリをクローン

```
git clone <リポジトリURL>
cd slay-app
```

2. Docker Compose でアプリケーションを起動

```
docker compose up -d
```

3. ブラウザでアクセス

```
http://localhost:3011
```

## ゲームデータへのアクセス

### Mac の場合

Slay the Spire の run データは通常以下のパスに保存されています：

```
~/Library/Application Support/SlayTheSpire/runs
```

### Windows の場合

Slay the Spire の run データは通常以下のパスに保存されています：

```
%LOCALAPPDATA%\SlayTheSpire\runs
```

### データのマウント

docker-compose.yml を編集して、実際のゲームデータをマウントします：

```yaml
volumes:
  - /path/to/SlayTheSpire/runs:/runs
```

Mac の場合の例：

```yaml
volumes:
  - ~/Library/Application Support/SlayTheSpire/runs:/runs
```

## サンプルデータの使用

テスト用に以下のサンプルデータが含まれています：

```
/server/sample-data/
```

## 開発ガイド

### ディレクトリ構造

- `/server` - バックエンド API サーバー（Express + TypeScript）
- `/client-app` - フロントエンドアプリケーション（Next.js）

### 開発モード

```
# バックエンド開発
cd server
npm run dev

# フロントエンド開発
cd client-app
npm run dev
```

## ライセンス

MIT
