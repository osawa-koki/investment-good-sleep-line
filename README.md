# investment-good-sleep-line

💤💤💤 安眠ラインを探せ！！！  

[![ci](https://github.com/osawa-koki/investment-good-sleep-line/actions/workflows/ci.yml/badge.svg)](https://github.com/osawa-koki/investment-good-sleep-line/actions/workflows/ci.yml)
[![cd](https://github.com/osawa-koki/investment-good-sleep-line/actions/workflows/cd.yml/badge.svg)](https://github.com/osawa-koki/investment-good-sleep-line/actions/workflows/cd.yml)
[![Dependabot Updates](https://github.com/osawa-koki/investment-good-sleep-line/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/osawa-koki/investment-good-sleep-line/actions/workflows/dependabot/dependabot-updates)

## 実行方法

```shell
# モジュールのインストール
npm install

# 開発用実行
npm run dev

# ビルド
npm run build
```

Dockerを使用する場合は以下のコマンドを実行してください。  

```shell
# Dockerイメージのビルド
docker build -t investment-good-sleep-line .

# Dockerコンテナの実行
docker run --rm -d -p 80:80 --name investment-good-sleep-line investment-good-sleep-line
```
