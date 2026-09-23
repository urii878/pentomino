// PUBLIC_URL: 公開時は仮URLをHTML・robots.txt・sitemap.xmlと同期してください。
window.GAME_CONFIG = {
  "id": "pentomino",
  "title": "ペントミノ",
  "shortDescription": "12のかたちを、ぴったりひとつに。",
  "seoTitle": "ペントミノ｜無料で遊べるパズルゲーム",
  "description": "ペントミノを無料で遊べるブラウザパズルゲームです。12種類のピースを回転・反転させて盤面を埋めよう。スマホ・PC対応、インストール不要です。",
  "keywords": [
    "ペントミノ",
    "ペントミノ パズル",
    "ペントミノ ゲーム",
    "ペントミノ 無料",
    "ペントミノ オンライン"
  ],
  "canonicalUrl": "https://example.com/pentomino/",
  "ogImage": "./assets/og-image.png",
  "portalName": "アタマアソビ",
  "portalUrl": "https://atama-asobi.vercel.app/",
  "eyebrow": "無料・インストール不要",
  "howToHtml": "<ul><li>ドラッグで配置</li><li>タップで90°回転</li><li>ダブルタップで左右反転</li><li>すべて埋めるとクリア</li></ul><p>練習のヒントは1回につき30秒加算されます。本番は12種類すべてを使う共通問題で、ヒントは使えません。</p>",
  "aboutHtml": "<p>ペントミノは、5個の正方形を辺でつないでできる12種類のピースを組み合わせて盤面を埋める定番パズルです。</p><p>入門は3ピース、基礎は5ピース、応用は8ピース。練習で形に慣れたら、12ピースのペントミノに挑戦しましょう。</p>",
  "faq": [
    {
      "q": "無料で遊べますか？",
      "a": "はい。ペントミノを無料で遊べます。インストールや会員登録は不要です。"
    },
    {
      "q": "スマホでも遊べますか？",
      "a": "はい。スマホでは指、PCではマウスで操作できます。"
    },
    {
      "q": "ピースはどうやって回転しますか？",
      "a": "ピースをタップすると90°回転します。素早く2回タップすると左右反転します。"
    },
    {
      "q": "本来のペントミノはどのモードですか？",
      "a": "ホーム最上部の「ペントミノ」です。12種類すべてで60マスを埋める本番モードで、ランキングの対象です。"
    }
  ],
  "ads": {
    "enabled": false
  },
  "ranking": {
    "enabled": true,
    "supabaseUrl": "https://nbwcdvqhzgxjpnzgtvqn.supabase.co",
    "supabaseAnonKey": "sb_publishable_lO1k_kKGXt6yrHA2QehHGg_DzCvlvE9",
    "table": "pentomino_scores",
    "sortDirection": "asc",
    "secondaryColumn": "moves",
    "secondaryDirection": "asc",
    "limit": 10
  }
};

