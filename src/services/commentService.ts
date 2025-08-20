export interface EpcComment {
    commentId: number;
    epcCode: string;
    author: string;
    timestamp: string;
    content: string;
}

const dummyComments: EpcComment[] = [
    { commentId: 1, epcCode: "1.880.123.695", author: "김철수", timestamp: "2025-08-15T14:30:00Z", content: "확인 결과, 전북_도매상2로의 이동은 시스템 스캔 오류로 판명됨. 실제 물품은 정상 경로에 있음." },
    { commentId: 2, epcCode: "1.880.123.695", author: "박영희", timestamp: "2025-08-16T10:00:00Z", content: "해당 오류 건에 대해 담당자에게 전달 완료했습니다." },
];

export async function fetchComments(epcCode: string): Promise<EpcComment[]> {
    if (process.env.NEXT_PUBLIC_MOCK_API === 'true') {
        console.log(`[MOCK SERVICE] Fetching comments for ${epcCode}`);
        return Promise.resolve(dummyComments.filter(c => c.epcCode === epcCode));
    } else {
        const response = await fetch(`/api/comments/${epcCode}`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        return response.json();
    }
}

export async function postComment(epcCode: string, content: string): Promise<EpcComment> {
    if (process.env.NEXT_PUBLIC_MOCK_API === 'true') {
        console.log(`[MOCK SERVICE] Posting comment for ${epcCode}: ${content}`);
        const newComment: EpcComment = {
            commentId: Math.floor(Math.random() * 1000) + 3,
            epcCode,
            author: "현재 사용자",
            timestamp: new Date().toISOString(),
            content,
        };
        dummyComments.push(newComment);
        return Promise.resolve(newComment);
    } else {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ epcCode, content }),
        });
        if (!response.ok) throw new Error("Failed to post comment");
        return response.json();
    }
}