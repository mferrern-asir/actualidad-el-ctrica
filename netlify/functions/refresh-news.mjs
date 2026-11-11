import Parser from 'rss-parser';
import { getStore } from '@netlify/blobs';

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'ActualidadElectrica/1.0' } });
const FEEDS = [
  { name: 'Google News · Coche eléctrico', url: 'https://news.google.com/rss/search?q=%22Coche+el%C3%A9ctrico%22&hl=es&gl=ES&ceid=ES:es' },
  { name: 'BOE', url: 'https://www.boe.es/rss/boe.php' },
  { name: 'InsideEVs · Battery Tech', url: 'https://insideevs.com/rss/category/battery-tech/' }
];
const clean = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim().slice(0, 600);

function categories(text) {
  const s = text.toLocaleLowerCase('es');
  const rules = {
    'Coches y movilidad': ['coche eléctrico','coches eléctricos','vehículo eléctrico','movilidad eléctrica','eléctrico'],
    'Ayudas': ['ayuda','subvención','subvenciones','boe','idae','plan auto','incentivo'],
    'Baterías y tecnología': ['batería','baterías','battery','lfp','estado sólido','autonomía'],
    'Recarga': ['recarga','cargador','electrolinera','carga pública'],
    'Aragón': ['aragón','zaragoza','huesca','teruel'],
    'Pruebas y comparativas': ['prueba','comparativa','review']
  };
  const out = Object.entries(rules).filter(([, words]) => words.some(w => s.includes(w))).map(([name]) => name);
  return out.length ? out : ['Coches y movilidad'];
}

async function collect() {
  const results = await Promise.allSettled(FEEDS.map(async feed => {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).map(item => {
      const url = item.link || item.guid;
      if (!url || !/^https?:\/\//i.test(url)) return null;
      const title = clean(item.title);
      if (!title) return null;
      const date = item.isoDate || item.pubDate || item.date;
      const parsedDate = date ? new Date(date) : null;
      const summary = clean(item.contentSnippet || item.summary || item.content || '');
      return {
        t: title,
        d: parsedDate && !Number.isNaN(parsedDate.valueOf()) ? parsedDate.toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        s: feed.name, u: url, r: summary || 'Consulta la publicación original.',
        c: categories(title + ' ' + summary)
      };
    }).filter(Boolean);
  }));

  const fresh = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const store = getStore('actualidad-electrica-news');
  const previous = await store.get('history.json', { type: 'json' }) || [];
  const byUrl = new Map(previous.map(n => [n.u, n]));
  for (const item of fresh) if (!byUrl.has(item.u)) byUrl.set(item.u, item);
  const history = [...byUrl.values()].sort((a,b) => (b.d || '').localeCompare(a.d || '')).slice(0, 5000);
  await store.setJSON('history.json', history);
  await store.setJSON('status.json', {
    updatedAt: new Date().toISOString(),
    fetched: fresh.length,
    total: history.length,
    failedFeeds: results.filter(r => r.status === 'rejected').length
  });
  return { fetched: fresh.length, total: history.length, failedFeeds: results.filter(r => r.status === 'rejected').length };
}

export default async () => {
  try {
    const result = await collect();
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'No se pudo actualizar el histórico' }), { status: 500 });
  }
};
