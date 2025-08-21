import apiClient from './apiClient';

const isMock = process.env.NEXT_PUBLIC_MOCK_API === 'true';


const mockGetMyProfile = (): Promise<{ userName: string; email: string; }> => {
    return new Promise(resolve => {
        console.log('%c[MOCK API] getMyProfile', 'color: #10B981');
        setTimeout(() => {
            resolve({
                userName: '강나현',
                email: 'nang5587@logistics.com',
            });
        }, 500);
    });
};

const mockUpdateProfileInfo = (data: { userName?: string; email?: string; status?: string }): Promise<any> => {
    return new Promise(resolve => {
        console.log('%c[MOCK API] updateProfileInfo with data:', 'color: #F59E0B', data);
        setTimeout(() => {
            resolve({
                success: true,
                message: '프로필이 성공적으로 업데이트되었습니다. (Mock)',
                updatedData: data, 
            });
        }, 700);
    });
};

const mockChangePassword = (data: { password: string; newPassword: string; }): Promise<any> => {
    return new Promise((resolve, reject) => {
        console.log('%c[MOCK API] changePassword called', 'color: #F59E0B');
        setTimeout(() => {
            if (data.password === 'wrongpassword') {
                console.error('[MOCK API] FAILED: Incorrect current password');
                reject({
                    response: { 
                        data: {
                            message: '현재 비밀번호가 일치하지 않습니다. (Mock Error)',
                        },
                        status: 400,
                    }
                });
            } else {
                console.log('[MOCK API] SUCCESS: Password changed');
                resolve({
                    success: true,
                    message: '비밀번호가 성공적으로 변경되었습니다. (Mock)',
                });
            }
        }, 1000); 
    });
};


const realGetMyProfile = async (): Promise<{ userName: string; email: string; }> => {
    const response = await apiClient.get('/manager/settings/user');
    return response.data;
};

const realUpdateProfileInfo = async (data: { userName?: string; email?: string; status?: string }) => {
    const response = await apiClient.patch('/manager/settings/info', data);
    return response.data;
};

const realChangePassword = async (data: { password: string; newPassword: string; }) => {
    const response = await apiClient.post('/manager/settings/password', data);
    return response.data;
};



export const getMyProfile = isMock ? mockGetMyProfile : realGetMyProfile;
export const updateProfileInfo = isMock ? mockUpdateProfileInfo : realUpdateProfileInfo;
export const changePassword = isMock ? mockChangePassword : realChangePassword;

export const deleteMyAccount = () => {
    return updateProfileInfo({ status: 'del' });
};