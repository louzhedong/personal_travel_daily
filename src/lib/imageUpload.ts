const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

interface ImgBBResponse {
  data?: {
    url?: string;
  };
  success?: boolean;
  error?: {
    message?: string;
  };
}

export async function uploadImageToImgBB(file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 ImgBB API Key，请配置 VITE_IMGBB_API_KEY');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${IMGBB_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as ImgBBResponse;
  if (!response.ok || !data.success || !data.data?.url) {
    throw new Error(data.error?.message || '图片上传失败');
  }

  return data.data.url;
}
