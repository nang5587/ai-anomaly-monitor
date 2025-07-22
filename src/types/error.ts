export interface ErrorPageProps {
    /**
     * 발생한 에러 객체입니다.
     * - message: 에러 메시지 문자열
     * - digest: 서버에서 발생한 에러의 경우, 소스 맵과 관련 없는
     *           서버 로그를 찾기 위한 고유 해시 값입니다. 프로덕션 환경에서 유용합니다.
     */
    error: Error & { digest?: string };

    /**
     * 에러 바운더리를 초기화하고 페이지 리렌더링을 시도하는 함수입니다.
     * 이 함수를 호출하면 error.tsx가 감싸고 있던 컴포넌트(예: page.tsx)를
     * 다시 렌더링하려고 시도합니다.
     */
    reset: () => void;
}