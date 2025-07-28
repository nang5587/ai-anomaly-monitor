/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // webpack 설정 추가
  webpack: (config, { isServer }) => {
    // 서버 사이드에서는 특정 모듈들을 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      };
    }
    
    // html2pdf.js와 관련된 모듈들 처리
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },

  // 실험적 기능 설정 (필요한 경우)
  experimental: {
    esmExternals: false,
  },
  
  // 여기에 다른 설정들이 있을 수 있습니다...
};

module.exports = nextConfig;