/* 公開時のサブディレクトリ */
const SUB_DIRECTORY = process.env.SUB_DIRECTORY ?? ''

/* 本番環境と開発環境の分岐用のフラグ */
const isProd = process.env.NODE_ENV === 'production'

/**
 * @type {import('next').NextConfig}
 */
export default {
  output: 'export',
  basePath: isProd ? SUB_DIRECTORY : '',
  assetPrefix: isProd ? SUB_DIRECTORY : '',
  publicRuntimeConfig: {
    basePath: isProd ? SUB_DIRECTORY : ''
  },
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}
