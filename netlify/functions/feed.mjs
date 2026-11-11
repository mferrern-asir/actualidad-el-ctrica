import { getStore } from '@netlify/blobs';

export default async () => {
  try {
    const store = getStore('actualidad-electrica-news');
    const news = await store.get('history.json', { type: 'json' }) || [];
    const status = await store.get('status.json', { type: 'json' }) || {};
    return new Response(JSON.stringify({ news, updatedAt: status.updatedAt || null, total: news.length }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ news: [], updatedAt: null, error: 'Histórico todavía no inicializado' }), {
      status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};
